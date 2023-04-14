import * as React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import {Audio} from "expo-av";
import {FontAwesome} from "@expo/vector-icons";


import firebase from "firebase";
import Constants from 'expo-constants';

import {useEffect} from "react";
import {parseEntriesFromJson} from "./Utilities";
import {prompt} from "./prompt";
import {Client} from "@anthropic-ai/sdk";


// const client = new Client(ANTHROPIC_API_KEY);
const OPENAI_API_KEY = Constants.manifest.extra.openaiApiKey;

const textStyles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  smallTextContainer: {
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
    fontSize: 14,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
});

const micColor = "#8B4726";

const newEntriesStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    backgroundColor: "white",
    width: "100%",
    flexWrap: "wrap",
    borderBottomWidth: 1,
  },
  leftCell: {
    flex: 1,
    width: "90%",
    alignItems: "flex-start",
  },
  rightCell: {
    alignItems: "flex-end",
  }
});


const micStyles = StyleSheet.create({
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: micColor,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 5,
  }
});


function AudioRecorder({fbase, setSelectedTopic}: any) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  const [transcriptionStatus, setTranscriptionStatus] = React.useState(null);
  const [transcriptionResult, setTranscriptionResult] = React.useState(null);

  const [topicsStatus, setTopicsStatus] = React.useState(null);
  const [topicsResult, setTopicsResult] = React.useState(null);

  const [isProcessing, setIsProcessing] = React.useState(false);

  const NO_TRANSCRIPTION_TEXT_MSG = "I didn't hear anything - sorry!";

  const userId = fbase.auth().currentUser.uid;

  const transcriptsCollection = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("transcripts");

  const topicsCollection = firebase
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('topics');

  async function getMostRecentLogging() {
    const snapshot = await transcriptsCollection.orderBy("timestamp", "desc").limit(1).get();
    if (snapshot.docs.length > 0) {
      const transcript = snapshot.docs[0].data();
      console.log('Most recent transcript: "', transcript.text, '" with entries: ', transcript.entries);
      return {'transcript': transcript.text, entries: transcript.entries};
    } else {
      console.log('getMostRecentLogging: no transcripts found.');
      return "";
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getMostRecentLogging();
        setTranscriptionResult(result.transcript);
        setTopicsResult(result.entries);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData().catch(error => console.error(error));
  }, [userId]);


  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16_BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const {recording} = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      console.log("Recording started");
      await recording.startAsync();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }


  async function addEntryToTopic(transcript, topic, value, time, date, log_timestamp) {
    // create the topic if it doesn't exist
    if (!time || !date) {
      console.error("ERROR - SKIPPING WRITE: addEntryToTopic: time or date is null");
      return;
    }

    const topicCollection = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("topics");
    const topicDoc = await topicCollection.doc(topic).get();
    if (!topicDoc.exists) {
      topicCollection.doc(topic).set({
        timestamp: log_timestamp,
      });
    }

    // add the entry to the topic
    const topicEntriesCollection = topicCollection
        .doc(topic)
        .collection("entries");

    return await topicEntriesCollection.add({
      transcript: transcript,
      value: value,
      time: time,
      date: date,
      log_time: log_timestamp
    }).then(function (docRef) {
      console.log("Entry added to topic: ", docRef.id);
      return docRef.id;
    }).catch(function (error) {
      console.error("Error adding entry to topic: ", error);
    });
  }

  async function writeEntriesToDB(transcript, entriesList, timestamp) {

    const entryAddPromises = entriesList.map(async (entry) => {
      const topic = entry.topic;
      let value = entry.value;
      const date = entry.date;
      const time = entry.time;

      if (isNaN(value)) {
        value = value.toString();
      } else {
        value = Number(value);
      }

      return await addEntryToTopic(transcript, topic, value, time, date, timestamp);

    });
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


    setTranscriptionStatus("Figuring out what you said...");
    const transcript = await postAudioRecording(recording.getURI());
    setTranscriptionStatus(null);
    console.log("transcript:", transcript);
    await processTranscript(transcript, timestamp);
  }


  // @ts-ignore
  async function processTranscript(transcript, timestamp) {
    if (transcript) {
      setTranscriptionResult(transcript);
      setTopicsStatus("Figuring out what you're logging...");
      const parsedEntries = await computeAndWriteTopics(transcript, timestamp);
      console.log("entriesString:", parsedEntries.entriesString);
      await handleTopicsTextUpdate(parsedEntries.entriesString);
    } else {
      setTranscriptionStatus(NO_TRANSCRIPTION_TEXT_MSG);
    }
  }

  async function postAudioRecording(audioUri: any) {
    try {
      if (!audioUri) {
        console.error('Invalid audio URI');
        return;
      }

      console.log("audioUri: ", audioUri);

      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      console.log("audioBlob: ", audioBlob);
      const url = `http://159.65.244.4:5555/transcribe?userId=${userId}`
      console.log("url: ", url);
      const response = await fetch(url, {
        method: 'POST',
        body: audioBlob,
        headers: {
          'Content-Type': audioBlob.type,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      console.log(responseData);
      return responseData['transcription']['text'];
    } catch (error) {
      console.error('Error posting audio recording:', error);
    }
  }

  function parseable(entriesString: string) {
    try {
      JSON.parse(entriesString);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function handleTopicsTextUpdate(entriesString: string) {
    const notParseable = !parseable(entriesString);
    if (
        !entriesString ||
        entriesString === "[]" ||
        notParseable ||
        Object.keys(entriesString).length == 0
    ) {
      console.log("entriesString:", entriesString);
      setTopicsStatus("Found no topics - sorry!");
      entriesString = "[]";
    } else {
      setTopicsStatus(null);
    }
    setTopicsResult(entriesString);
    return;
  }

  async function computeAndWriteTopics(transcript: string, timestamp) {
    const entries = await getTopicsTurbo(transcript);
    const parsedEntries = parseEntriesFromJson(entries);
    const ids = await writeEntriesToDB(transcript, parsedEntries.entriesList, timestamp);
    console.log("computeAndWriteTopics ids:", ids);
    await transcriptsCollection
        .add({
          text: transcript, entries: parsedEntries.entriesString, timestamp: timestamp,
          ids: ids
        })
        .then((docRef) => {
          console.log("Transcript written with ID: ", docRef.id);
        });


    return parsedEntries;
  }

  // gets just the time, in the format HH:MM
  function get_current_time() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
  }

  function get_current_date() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  async function getEntryTurbo(input: string, headers: any) {
    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {role: 'system', content: prompt},
        {role: 'user', content: input}]
    };

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
    console.log("Completion: ", completion);
    const new_entry = completion['choices'][0]['message']['content'].replace("topics: ", "");
    console.log("new_entry: ", new_entry);
    return new_entry;
  }

  async function getEntryClaude(input: string) {
    const full_prompt = prompt + '\n' + input;
    console.log("full_prompt for Claude: ", full_prompt);
    const data = {
      model: 'claude-instant-v1',
      prompt: full_prompt,
      max_tokens_to_sample: 200,
      stop_sequences: ["\n\nHuman:", "## input"],
      temperature: 0.3,
    };

    const completion = await client.complete(data).then(res => res);
    console.log("Completion: ", completion);
    const new_entry = completion['completion'];
    console.log("new_entry: ", new_entry);
    return new_entry;
  }

  async function makeInputDictForLLM(text: string) {
    let topicsString;

    await topicsCollection.get().then((querySnapshot) => {
      const topics = querySnapshot.docs.map((doc) => doc.id);
      topicsString = topics.join(', ');
      console.log("existing topicsString: ", topicsString);
    });

    const date = get_current_date();
    const time = get_current_time();
    console.log("date: ", date, "time: ", time);
    return {
      "transcript": text, "date": date, "time": time, "existing": topicsString,
    }
  }

  async function getTopicsTurbo(text: string) {
    const headers = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const inputDict = await makeInputDictForLLM(text);

    const input = "## input\n" + JSON.stringify(inputDict) + "\n## output\n";
    console.log("LLM input: ", input);

    const new_entry = await getEntryTurbo(input, headers);
    // const new_entry = await getEntryClaude(input);
    console.log("New entry: ", new_entry);
    return new_entry;
  }

  const handleTopicPress = (topic: any) => {
    setSelectedTopic(topic);
  };


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
  if (!topicsResult) {
    setTopicsResult(JSON.stringify([]));
  }
  let entriesList;
  try {
    entriesList = JSON.parse(topicsResult);
  } catch (e) {
    console.log("Error parsing topicsResult: ", e);
    entriesList = [];
  }

  let rows: { topic: string, entry: number }[] = [];
  if (entriesList && entriesList.length > 0) {
    rows = entriesList.map(({topic, value, date, time}) => ({
      topic,
      value,
      date,
      time
    }));
  }

  // records, then uploads the recording. The recording button
  // changes to a stop button when recording.
  return (
      <View style={[textStyles.rowContainer, {alignItems: "center"}]}>
        <View style={{width: "35%"}}>
          <View style={textStyles.smallTextContainer}>
            <Text style={textStyles.smallText}>{transcriptionStatus}</Text>
          </View>
          <View style={textStyles.mainTextContainer}>
            <ScrollView contentContainerStyle={{alignItems: "flex-start"}}>
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
              style={{height: 56}}
          >
            {isRecording ? (
                <Text>
                  <FontAwesome name="stop" size={56} color="#CD2626"/>
                </Text>
            ) : (
                <Text>
                  {isProcessing ? (
                      <FontAwesome name="gear" color="gray" size={56}/>
                  ) : (
                      <View style={micStyles.circle}>
                        <FontAwesome name="microphone" size={56} color={micColor}/>
                      </View>
                  )}
                </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{width: "35%"}}>
          <View style={textStyles.smallTextContainer}>
            <Text style={textStyles.smallText}>{topicsStatus}</Text>
          </View>
          <View style={[textStyles.mainTextContainer, {alignSelf: "flex-end"}]}>
            <FlatList
                data={rows}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => (
                    <TouchableOpacity onPress={() => handleTopicPress(item.topic)}>
                      <View style={newEntriesStyles.row}>
                        <Text style={[newEntriesStyles.leftCell, {textAlign: "left"}]}>
                          {item.topic}
                        </Text>
                        <Text style={[newEntriesStyles.rightCell, {textAlign: "right"}]}>
                          {item.value}
                        </Text>
                      </View>
                    </TouchableOpacity>
                )}
            />
          </View>
        </View>
      </View>
  );
}

export default AudioRecorder;
