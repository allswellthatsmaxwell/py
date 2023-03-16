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
import {FontAwesome, Feather} from "@expo/vector-icons";
import axios from 'axios';
import {Buffer} from "buffer";

import * as firebase from "firebase";

import {ASSEMBLYAI_API_KEY, OPENAI_API_KEY, DEEPGRAM_API_KEY} from "./Keys";
import {useEffect} from "react";


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
  cell: {
    flex: 1,
    alignItems: "center",
  }
});


const micStyles = StyleSheet.create({
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: micColor,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 5,
  }
});


function AudioRecorder({fbase, setSelectedTopic}) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  const [transcriptionStatus, setTranscriptionStatus] = React.useState(null);
  const [transcriptionResult, setTranscriptionResult] = React.useState(null);

  const [topicsStatus, setTopicsStatus] = React.useState(null);
  const [topicsResult, setTopicsResult] = React.useState(null);

  const [isProcessing, setIsProcessing] = React.useState(false);

  const NO_TRANSCRIPTION_TEXT_MSG = "I didn't hear anything - sorry!";

  const storage = fbase.storage();
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
    console.log('Snapshot docs:', snapshot.docs);
    if (snapshot.docs.length > 0) {
      const transcript = snapshot.docs[0].data();
      console.log('Most recent transcript: "', transcript.text, '" with topics: ', transcript.topics);
      return {'transcript': transcript.text, topics: transcript.topics};
    } else {
      console.log('getMostRecentLogging: no transcripts found.');
      return null;
    }
  }

  useEffect(() => {
    console.log('Executing useEffect');

    async function fetchData() {
      try {
        const result = await getMostRecentLogging();
        setTranscriptionResult(result.transcript);
        setTopicsResult(result.topics);
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
    const topicCollection = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("topics");
    // const topicDoc = await topicCollection.doc(topic).get();
    // if (!topicDoc.exists) {
    //   topicCollection.doc(topic).set({
    //     timestamp: timestamp,
    //   });
    // }

    // add the entry to the topic
    const topicEntriesCollection = topicCollection
        .doc(topic)
        .collection("entries");
    topicEntriesCollection.add({
      transcript: transcript,
      value: value,
      time: time,
      date: date,
      log_time: log_timestamp
    });
    console.log("Added entry to topic", topic);
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

      await addEntryToTopic(transcript, topic, value, time, date, timestamp);

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

    // setTranscriptionStatus("Preparing audio...");
    // const audio_url = await sendRecording(recording);
    // console.log("upload_url response:", audio_url);

    setTranscriptionStatus("Figuring out what you said...");
    const transcript = await postAudioRecording(recording.getURI());
    setTranscriptionStatus(null);
    console.log("transcript:", transcript);
    await processTranscript(transcript, timestamp);
  }

  // async function stopRecordingDeepgram() {
  //   try {
  //     console.log('Stopping recording');
  //     await recording.stopAndUnloadAsync();
  //
  //     const { uri } = recording.getURI();
  //     console.log('Recording URI:', uri);
  //
  //     const file = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  //     const base64Data = `data:audio/x-m4a;base64,${file}`;
  //
  //     const streamSource = {
  //       stream: Buffer.from(base64Data.split(',')[1], 'base64'),
  //       mimetype: 'audio/x-m4a',
  //     };
  //
  //     const response = await deepgram.transcription.preRecorded(streamSource, {
  //       punctuate: true,
  //     });
  //
  //     console.log('Transcription:', response.transcript);
  //   } catch (err) {
  //     console.error('Failed to stop recording and get transcript', err);
  //   }
  // }

  async function processTranscript(transcript, timestamp) {
    if (transcript) {
      setTranscriptionResult(transcript);
      setTopicsStatus("Figuring out what you're logging...");
      const topics = await computeAndWriteTopics(transcript, timestamp);
      console.log("topicssss:", topics);
      await handleTopicsTextUpdate(topics);
    } else {
      setTranscriptionStatus(NO_TRANSCRIPTION_TEXT_MSG);
    }
  }

  async function postAudioRecording(audioUri) {
    try {
      if (!audioUri) {
        console.error('Invalid audio URI');
        return;
      }

      console.log("audioUri: ", audioUri);

      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      console.log("audioBlob: ", audioBlob);
      const response = await fetch('http://159.65.244.4:5555/transcribe', {
        method: 'POST',
        body: audioBlob,
        headers: {
          'Content-Type': audioBlob.type,
        },
      });

      // Check if the response is successful
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

  function parseable(topics) {
    try {
      JSON.parse(topics);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function handleTopicsTextUpdate(topics) {
    const notParseable = !parseable(topics);
    if (
        !topics ||
        topics === "{}" ||
        topics == {} ||
        notParseable ||
        Object.keys(topics).length == 0
    ) {
      setTopicsStatus("Found no topics - sorry!");
      topics = "{}";
    } else {
      setTopicsStatus(null);
    }
    setTopicsResult(topics);
    return;
  }

  async function computeAndWriteTopics(transcript, timestamp) {
    const entries = await getTopicsTurbo(transcript); // getTopics(transcript);
    let entriesList;
    let entriesString;
    try {
      console.log("Trying to parse entries: ", entries);
      entriesList = JSON.parse(entries);
      entriesString = entries;
    } catch (e) {
      console.log("Error parsing entries: ", e);
      entriesList = [];
      entriesString = "[]";
    }
    await transcriptsCollection
        .add({text: transcript, topics: entriesString, timestamp: timestamp})
        .then((docRef) => {
          console.log("Transcript written with ID: ", docRef.id);
        });

    await writeEntriesToDB(transcript, entriesList, timestamp);
    return topics;
  }

  const current_time = new Date().toLocaleTimeString();

  const system_message = `# Role
You are a topics categorizer. You only output a single valid json list, no matter what. Given an audio transcription and a list of existing topics, you output the topic or topics
that the user is trying to log. You speak all languages and name topics in the user's language. You only ever output
valid json, no matter what. If there is nothing to log, you output an empty json.

# Instructions
You do this by completing the json dictionary fragment the user gives you. 
Do not output anything except the completion of the json the user gives you.
You complete that json then stop, without saying anything else at all. 
The user may already have many existing topics. It is a better user experience if new logs that belong in an existing one
are assigned to that existing one. So even if you feel like there is a better phrasing for the topic, use the existing one,
if their meaning is the same. If you can't assign an entry to an existing topic, create a new topic.

The user may be trying to log multiple topics. If so, you should complete the json with multiple key-value pairs.

# Time of day
The user may also be trying to log a time of day for one or more of their entries. 
If so, include a key "time" in the json, with the time they said, for that topic.
If not, skip that key.

# When nothing is being logged
If there is nothing that could be logged from the transcript, complete an empty json: []. Do not say anything else,
because saying anything except an empty json for no topics would create an unparsable json.

# Output topic names and values in the user's language
No need to always use only English! Match the user's language as much as possible.

# Examples
## input
{transcript: "I drank a coffee at 9am and went to the gym at noon", 
 today: "2023-01-01", time_now: "14:00"}
## output
topics: [{"topic": "coffee", "value": "1", "time": 09:00", "date": "2023-01-01"}, 
          {"topic": "gym", "value": "1", time": "12:00", "date": "2023-01-01"}]}

## input
{"transcript": "I had 100 milligrams of caffeine",
 "today": "2023-06-17", "time_now": "14:37"}
## output
[{"topic": "caffeine", "value": "100", "time": "14:37", "date": "2023-06-17"}]}
 
## input
{"transcript": "I ate four slices of pizza at 7pm yesterday",
 "today": "2021-02-14", "time_now": "18:00"}
## output
[{"topic": "pizza (slices)", "value": "4", "time": "19:00", "date": "2021-02-13"}]}

## input
{"transcript": "I had 4 drinks at 10pm yesterday and today I woke up at 11 a.m",
 "today": "2022-11-01", "time_now": "11:32"}
## output
[{"topic": "drinks", "value": "4", "time": "22:00", "date": "2022-10-31"},
 {"topic": "wake up time", "value": "1", "time": "11:00", "date": "2022-11-01"}]}

# Format
It is critical that you output a valid json list, no matter what.
`


  async function getTopicsTurbo(text) {
    const headers = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    let topicsString;

    await topicsCollection.get().then((querySnapshot) => {
      const topics = querySnapshot.docs.map((doc) => doc.id);
      topicsString = topics.join(', ');
      console.log("existing topicsString: ", topicsString);
    });

    const input = "{transcript: \"" + text +
        "\", existing: \"" + topicsString +
        "\", topics: "

    console.log("turbo input: ", input);

    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: system_message
        },
        {
          role: 'user',
          content: input
        }]
    };

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());

    console.log("Completion: ", completion);
    const new_entry = completion['choices'][0]['message']['content'];
    // strip specifically { and } from new_entry. other characters are unchanged
    const new_entry_stripped = new_entry.replace(/{/g, '').replace(/}/g, '');
    const new_entry_final = "{" + new_entry_stripped + "}";
    console.log("New entry final: ", new_entry_final);
    return new_entry_final;
  }

  const handleTopicPress = (topic) => {
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
    setTopicsResult(JSON.stringify({}));
  }
  let topicsDict;
  try {
    topicsDict = JSON.parse(topicsResult);
  } catch (e) {
    console.log("Error parsing topicsResult: ", e);
    topicsDict = {};
  }

  let time;
  if ("event_timestamp" in topicsDict) {
    time = topicsDict["event_timestamp"];
  } else {
    time = current_time;
  }

  console.log("topicsDict: ", topicsDict);
  let rows: { topic: string, entry: number }[] = [];
  if (topicsDict) {
    rows = Object.entries(topicsDict).map(([topic, entry]) => ({
      topic,
      entry,
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

                  {console.log("isProcessing: ", isProcessing)}
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
                        <Text style={[newEntriesStyles.cell, {textAlign: "left"}]}>
                          {item.topic}
                        </Text>
                        <Text style={[newEntriesStyles.cell, {textAlign: "right"}]}>
                          {item.entry}
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


// async function saveRecordingToFirebase(recording) {
//   const uri = recording.getURI();
//   console.log("URI: ", uri);
//   const timestamp = Date.now();
//   const storageRef = storage
//       .ref()
//       .child(`users/${userId}/audio/${timestamp}.wav`);
//   console.log("storageRef: ", storageRef);
//   const response = await fetch(uri);
//   console.log("response: ", response);
//   const blob = await response.blob();
//   console.log("blob: ", blob);
//   try {
//     await storageRef.put(blob);
//   } catch (err) {
//     console.error("Failed to upload audio", err);
//   }
//   console.log("Uploaded audio!");
//   return storageRef.getDownloadURL();
// }

// async function callDeepgramAPI(audioUrl: string) {
//   const requestOptions: RequestInit = {
//     method: 'POST',
//     headers: {
//       'Authorization': `Token ${DEEPGRAM_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({url: audioUrl}),
//   };
//
//   try {
//     const response = await fetch('https://api.deepgram.com/v1/listen', requestOptions);
//     if (!response.ok) {
//       throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
//     }
//     const responseData = await response.json();
//     console.log(responseData);
//     return responseData;
//   } catch (error) {
//     console.error('Error calling Deepgram API:', error);
//   }
// }
