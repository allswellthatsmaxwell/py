import * as React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { Audio } from "expo-av";
import { FontAwesome, Feather } from "@expo/vector-icons";

import * as firebase from "firebase";

import { ASSEMBLYAI_API_KEY } from "./Keys.js";

const textStyles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  smallTextContainer: {
    // backgroundColor: "#9E9E9E",
    paddingTop: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    width: 400,
  },
  smallText: {
    color: "#000",
    fontSize: 8,
  },
  mainTextContainer: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    // alignSelf: "flex-start",
    maxWidth: "100%",
    width: 400,
    height: 170,
    maxHeight: 170,
    // padding: 10,
    paddingHorizontal: 10,
    marginTop: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    overflow: "hidden",
  },
  mainText: {
    fontSize: 17,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
});

const newEntriesStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    backgroundColor: 'white',
    width : '100%',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  tableContainer: {
    flex: 1,
    alignItems: "left",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: '#000000',
    marginLeft: -10, // add this
    marginRight: -10, // add this
    width: '100%', // add this
  },
});

function AudioRecorder({ fbase }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  const [transcriptionStatus, setTranscriptionStatus] = React.useState(null);
  const [transcriptionResult, setTranscriptionResult] = React.useState(
    "Ok so today I played two games of go in the afternoon and had three drinks in the evening " +
      "and then I went to bed around 3:40 a.m"
  );

  const [topicsStatus, setTopicsStatus] = React.useState(null);
  const [topicsResult, setTopicsResult] = React.useState(
    '{"alcoholic drinks": 3, "games of go": 2}'
  );

  const [isProcessing, setIsProcessing] = React.useState(false);

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
        console.log("kickoff: ", res.data);
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
      console.log("Recording started");
      await recording.startAsync();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function sendRecording(recording) {
    const uri = recording.getURI();
    console.log("URI: ", uri);
    const timestamp = Date.now();
    const storageRef = storage
      .ref()
      .child(`users/${userId}/audio/${timestamp}.mp3`);
    console.log("storageRef: ", storageRef);
    const response = await fetch(uri);
    console.log("response: ", response);
    const blob = await response.blob();
    console.log("blob: ", blob);
    try {
      await storageRef.put(blob);
    } catch (err) {
      console.error("Failed to upload audio", err);
    }
    console.log("Uploaded audio!");
    return storageRef.getDownloadURL();
  }

  async function _poll(transcription_id) {
    const endpoint = `https://api.assemblyai.com/v2/transcript/${transcription_id}`;
    let status = "processing";
    while (status !== "completed" && status !== "error") {
      const response = await fetch(endpoint, {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
        },
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

  async function addEntryToTopic(topic, value, transcript, timestamp) {
    // create the topic if it doesn't exist
    const topicCollection = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("topics");
    const topicDoc = await topicCollection.doc(topic).get();
    if (!topicDoc.exists) {
      topicCollection.doc(topic).set({
        timestamp: timestamp,
      });
    }
    // add the entry to the topic
    const topicEntriesCollection = topicCollection
      .doc(topic)
      .collection("entries");
    topicEntriesCollection.add({
      transcript: transcript,
      timestamp: timestamp,
      number: value,
    });
    console.log("Added entry to topic", topic);
  }

  async function writeTopicsToDB(jsonResponseTranscript, topics, timestamp) {
    const topicsDict = JSON.parse(topics);

    const entryAddPromises = Object.entries(topicsDict).map(
      async ([topic, value]) => {
        await addEntryToTopic(topic, value, jsonResponseTranscript, timestamp);
      }
    );
    return await Promise.all(entryAddPromises);
  }

  async function stopRecording() {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
    });

    setTranscriptionStatus("Preparing audio...");
    const audio_url = await sendRecording(recording);
    console.log("upload_url response:", audio_url);

    setTranscriptionStatus("Figuring out what you said...");
    const transcriptionId = await kickoffTranscription(audio_url);
    console.log("transcription_id:", transcriptionId);
    const transcript = await _poll(transcriptionId);
    console.log("transcript:", transcript);
    setTranscriptionResult(transcript);
    setTranscriptionStatus(null);
    setTopicsStatus("Figuring out what you're logging...");

    // topics is a comma separated string
    const topics = await getTopics(transcript);

    const transcriptsCollection = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("transcripts");
    await transcriptsCollection
      .add({ text: transcript, topics: topics, timestamp: timestamp })
      .then((docRef) => {
        console.log("Transcript written with ID: ", docRef.id);
      });

    await writeTopicsToDB(transcript, topics, timestamp);
    setTopicsResult(topics);
    setTopicsStatus(null);
  }

  async function getTopics(text) {
    const response = await fetch(`http://159.65.244.4:5555/topics`, {
      method: "POST",
      body: JSON.stringify({ text: text }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const jsonResponse = await response.json();
    console.log("Topics received: ", jsonResponse.topics);
    return jsonResponse.topics;
  }

  async function handlePress() {
    if (isProcessing) {
      return;
    } else if (isRecording) {
      setIsProcessing(true);
      setIsRecording(false);
      await stopRecording();
      setIsProcessing(false);
    } else {
      setTranscriptionResult(null);
      setTopicsResult(null);
      setIsRecording(true);
      await startRecording();
    }
  }

  console.log("topicsResult: ", topicsResult);
  topicsDict = JSON.parse(topicsResult);
  console.log("topicsDict: ", topicsDict);
  let rows = {};
  if (topicsDict) {
    rows = Object.entries(JSON.parse(topicsResult)).map(([topic, entry]) => ({ topic, entry }));
  }
  // records, then uploads the recording. The recording button
  // changes to a stop button when recording.
  return (
    <View style={[textStyles.rowContainer, { alignItems: "center" }]}>
      <View style={{ width: "35%" }}>
        <View style={textStyles.smallTextContainer}>
          <Text style={textStyles.smallText}>{transcriptionStatus}</Text>
        </View>
        <View style={textStyles.mainTextContainer}>
          <ScrollView contentContainerStyle={{ alignItems: "flex-start" }}>
            <Text style={textStyles.mainText}>{transcriptionResult}</Text>
          </ScrollView>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "stretch",
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          underlayColor={isProcessing ? "red" : "white"}
          style={{ height: 56 }}
        >
          {isRecording ? (
            <Text>
              <FontAwesome name="stop" size={56} color="#B22222" />
            </Text>
          ) : (
            <Text>
              {isProcessing ? (
                <FontAwesome name="gear" color="gray" size={56} />
              ) : (
                <FontAwesome name="microphone" size={56} color="#03A89E" />
              )}

              {console.log("isProcessing: ", isProcessing)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ width: "35%" }}>
        <View style={textStyles.smallTextContainer}>
          <Text style={textStyles.smallText}>{topicsStatus}</Text>
        </View>
        <View style={[textStyles.mainTextContainer, { alignSelf: "flex-end" }]}>
            <FlatList
              data={rows}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={newEntriesStyles.row}>
                  <Text style={[newEntriesStyles.cell, {textAlign: "left"}]}>{item.topic}</Text>
                  <Text style={[newEntriesStyles.cell, {textAlign: "right"}]}>{item.entry}</Text>
                </View>
              )}
            />
        </View>
      </View>
    </View>
  );
}

export default AudioRecorder;
