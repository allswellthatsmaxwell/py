
import * as React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
// imports useEffect hook
import { useEffect } from 'react';


export default function App() {
  const [transcriptionText, setTranscriptionText] = React.useState('...');
  const [topics, setTopics] = React.useState('___');

  return (
    <View style={styles.container}>
      <Text>Structured Voice Logger</Text>
      <AudioRecorder updateText={setTranscriptionText} updateTopics={setTopics} />
      <ChangeColor />
      <Text id="transcription-text">{transcriptionText}</Text>
      <Text id="topics-text">{topics}</Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


// a button that starts red and alternates between red and blue on click
function ChangeColor() {
  const [color, setColor] = React.useState('red');
  return (
    <View>
      <Button
        title="Change Color"
        color={color}
        onPress={() => {
          setColor(color === 'red' ? 'blue' : 'red');
        }}
      />
    </View>
  );
}


function AudioRecorder({updateText, updateTopics}) {
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

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
    });
    
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);

    const jsonResponseTranscript = await sendRecording(recording);
    // updates the transcription text asynchonously
    updateText(jsonResponseTranscript.text);
    const topics = await getTopics(jsonResponseTranscript.text);
    updateTopics(topics);
  }

  async function getTopics(text) {
    const response = await fetch(`http://159.65.244.4:5555/topics`, {
      method: 'POST',
      body: JSON.stringify({text: text}),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const jsonResponse = await response.json();
    console.log('Topics received:', jsonResponse.topics);
    return jsonResponse.topics;
  }

  
  // records, then uploads the recording. The recording button
  // changes to a stop button when recording.
  return (
    <View>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
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


function listenForTranscription(taskId) {
  // Create a new WebSocket instance
  const socket = new WebSocket("ws://159.65.244.4:5555/transcription/${taskId}");

  // Connection opened
  socket.addEventListener("open", (event) => {
    socket.send("Start listening for transcription");
  });

  // Listen for messages
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "transcription") {
      // Update UI with transcription text
      document.getElementById("transcription-text").innerText = data.text;
      // Close the socket
      socket.close();
    }
  });
}


// async function playRecording() {
//   // plays the recording in a way that will work on an iOS device
//   console.log('Playing recording..');
//   const { sound } = await recording.createNewLoadedSoundAsync();
//   await sound.playAsync();
// }
