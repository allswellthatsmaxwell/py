
import * as React from 'react';
import { View, Button } from 'react-native';
import { Audio } from 'expo-av';

import * as firebase from 'firebase';

import { ASSEMBLYAI_API_KEY } from './Keys.js';

// const firebaseConfig = {
//     apiKey: "AIzaSyBnn9Joa2K68y2u8yLvwFjAJgUcNOmODCk",
//     authDomain: "structured-voice-logger.firebaseapp.com",
//     projectId: "structured-voice-logger",
//     storageBucket: "structured-voice-logger.appspot.com",
//     messagingSenderId: "127564426167",
//     appId: "1:127564426167:web:77ff9ba27098012917d632",
//     measurementId: "G-5SDFE3KY7B"
// };

// if (!firebase.apps.length) {
//     firebase.initializeApp(firebaseConfig);
// }

// var storage = firebase.storage();

function AudioRecorder({ setTranscriptionStatus, setTopicsStatus, fbase }) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [recording, setRecording] = React.useState();

    const storage = fbase.storage();
    const userId = fbase.auth().currentUser.uid;

    async function kickoffTranscription(audio_url) {
        const axios = require("axios");

        const assembly = axios.create({
            baseURL: "https://api.assemblyai.com/v2",
            headers: {
                authorization: ASSEMBLYAI_API_KEY,
            },
        });
        return assembly
            .post("/transcript", {
                audio_url: audio_url,
            })
            .then((res) => {
                console.log("kickoff: ", res.data)
                return res.data.id;
            })
            .catch((err) => console.error(err));
    }

    async function startRecording() {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
            );
            setRecording(recording);
            console.log('Recording started');
            await recording.startAsync();
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function sendRecording(recording) {
        const uri = recording.getURI();
        console.log('URI: ', uri);
        const timestamp = Date.now();        
        const storageRef = storage.ref().child(`users/${userId}/audio/${timestamp}.mp3`);
        console.log('storageRef: ', storageRef);
        const response = await fetch(uri);
        console.log('response: ', response);
        const blob = await response.blob();
        console.log('blob: ', blob);
        try {
            await storageRef.put(blob);
        }
        catch (err) {
            console.error('Failed to upload audio', err);
        }
        console.log('Uploaded audio!');
        return storageRef.getDownloadURL();
    }

    // async function sendRecording(recording) {
    //     const uri = recording.getURI();
    //     const uriParts = uri.split('.');
    //     const fileType = uriParts[uriParts.length - 1];
    //     const formData = new FormData();
    //     formData.append('file', {
    //         uri,
    //         name: `recording.${fileType}`,
    //         type: `audio/${fileType}`,
    //         extension: fileType,
    //     });
    //     const options = {
    //         method: 'POST',
    //         body: formData,
    //         headers: {
    //             Accept: 'application/json',
    //             'Content-Type': 'multipart/form-data',
    //         },
    //     };

    //     try {
    //         const response = await fetch('http://159.65.244.4:5555/upload', options);
    //         responseJson = await response.json();
    //         console.log('Response:', responseJson);
    //         return responseJson;
    //     } catch (error) {
    //         console.error('Error:', error);
    //         return error;
    //     }
    // }

    async function _poll(transcription_id) {
        const endpoint = `https://api.assemblyai.com/v2/transcript/${transcription_id}`;
        let status = "processing";
        while (status !== "completed" && status !== "error") {
            const response = await fetch(
                endpoint,
                {
                    headers: {
                        authorization: ASSEMBLYAI_API_KEY
                    }
                });
            const jsonResponse = await response.json();
            console.log("jsonResponse: ", jsonResponse);
            if (!jsonResponse.status) {
                throw new Error(`No status in response: ${jsonResponse}`);
            } else if (jsonResponse.status === "completed") {
                return jsonResponse.text;
            } else {
                status = jsonResponse.status;
            }
        }
    }


    async function addEntryToTopic(topic, value, transcript, timestamp, userId) {
        // create the topic if it doesn't exist
        const topicCollection = firebase.firestore().collection('users').doc(userId).collection('topics');
        const topicDoc = await topicCollection.doc(topic).get();
        if (!topicDoc.exists) {
            topicCollection.doc(topic).set({
                timestamp: timestamp,
            });
        }
        // add the entry to the topic
        const topicEntriesCollection = topicCollection.doc(topic).collection('entries');
        topicEntriesCollection.add({
            transcript: transcript,
            timestamp: timestamp,
            number: value
        });
        console.log('Added entry to topic', topic);
    }

    async function writeTopicsToDB(jsonResponseTranscript, topics, timestamp, userId) {
        const topicsDict = JSON.parse(topics);

        const entryAddPromises = Object.entries(topicsDict).map(async ([topic, value]) => {
            await addEntryToTopic(topic, value, jsonResponseTranscript, timestamp, userId);
        });
        return await Promise.all(entryAddPromises);
    }


    async function stopRecording() {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp()
        console.log('Stopping recording..');
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
        });

        setTranscriptionStatus("Preparing audio...");
        const audio_url = await sendRecording(recording);
        console.log('upload_url response:', audio_url);

        setTranscriptionStatus("Figuring out what you said...");
        const transcriptionId = await kickoffTranscription(audio_url);
        console.log('transcription_id:', transcriptionId);
        const transcript = await _poll(transcriptionId);
        console.log('transcript:', transcript);
        setTranscriptionStatus(transcript);
        setTopicsStatus("Figuring out what you're logging...");

        // topics is a comma separated string
        const topics = await getTopics(transcript);      

        const userId = firebase.auth().currentUser.uid;
        const transcriptsCollection = firebase.firestore().collection('users').doc(userId).collection('transcripts');
        await transcriptsCollection.add({ text: transcript, topics: topics, timestamp: timestamp })
            .then((docRef) => {
                console.log('Transcript written with ID: ', docRef.id);
            }
        )

        await writeTopicsToDB(transcript, topics, timestamp, userId);
        setTopicsStatus(topics);
    }


    async function getTopics(text) {
        const response = await fetch(`http://159.65.244.4:5555/topics`, {
            method: 'POST',
            body: JSON.stringify({ text: text }),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        const jsonResponse = await response.json();
        console.log('Topics received: ', jsonResponse.topics);
        return jsonResponse.topics;
    }

    // records, then uploads the recording. The recording button
    // changes to a stop button when recording.
    return (
        <View>
            <Button
                title={isRecording ? 'Stop Recording' : 'Record'}
                onPress={async () => {
                    if (isRecording) {
                        await stopRecording();
                    } else {
                        await startRecording();
                    }
                    setIsRecording(!isRecording);
                }
                }
            />
        </View>
    );
}

export default AudioRecorder;

