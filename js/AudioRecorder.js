
import * as React from 'react';
import { View, Button } from 'react-native';
import { Audio } from 'expo-av';

import * as firebase from 'firebase';


function AudioRecorder({ updateText, updateTopics }) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [recording, setRecording] = React.useState();

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
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const formData = new FormData();
        formData.append('file', {
            uri,
            name: `recording.${fileType}`,
            type: `audio/${fileType}`,
            extension: fileType,
        });
        const options = {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        };

        try {
            const response = await fetch('http://159.65.244.4:5555/upload', options);
            const jsonResponse = await response.json();
            return jsonResponse;
        } catch (error) {
            console.error('Error:', error);
            return error;
        }
    }


    async function addEntryToTopic(topic, value, jsonResponseTranscript, timestamp, userId) {
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
            transcript: jsonResponseTranscript.text,
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

        const jsonResponseTranscript = await sendRecording(recording);
        updateText(jsonResponseTranscript.text);
        const userId = firebase.auth().currentUser.uid;

        // topics is a comma separated string
        const topics = await getTopics(jsonResponseTranscript.text);
        updateTopics(topics);

        await writeTopicsToDB(jsonResponseTranscript, topics, timestamp, userId);

        const transcriptsCollection = firebase.firestore().collection('users').doc(userId).collection('transcripts');
        return await transcriptsCollection.add({ text: jsonResponseTranscript.text, topics: topics, timestamp: timestamp })
            .then((docRef) => {
                console.log('Transcript written with ID: ', docRef.id);
            }
        )
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

// function listenForTranscription(taskId) {
//   // Create a new WebSocket instance
//   const socket = new WebSocket("ws://159.65.244.4:5555/transcription/${taskId}");

//   // Connection opened
//   socket.addEventListener("open", (event) => {
//     socket.send("Start listening for transcription");
//   });

//   // Listen for messages
//   socket.addEventListener("message", (event) => {
//     const data = JSON.parse(event.data);
//     if (data.type === "transcription") {
//       // Update UI with transcription text
//       document.getElementById("transcription-text").innerText = data.text;
//       // Close the socket
//       socket.close();
//     }
//   });
// }

export default AudioRecorder;