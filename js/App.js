
import * as React from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
// imports useEffect hook
import { useEffect } from 'react';

import { initializeApp } from "firebase";
import * as firebase from 'firebase';

// import { signInWithGoogle, signUpWithGoogle } from './authorization.js';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBnn9Joa2K68y2u8yLvwFjAJgUcNOmODCk",
  authDomain: "structured-voice-logger.firebaseapp.com",
  projectId: "structured-voice-logger",
  storageBucket: "structured-voice-logger.appspot.com",
  messagingSenderId: "127564426167",
  appId: "1:127564426167:web:77ff9ba27098012917d632",
  measurementId: "G-5SDFE3KY7B"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Get the authentication service
var auth = firebase.auth();


export default function App() {
  const [transcriptionText, setTranscriptionText] = React.useState('...');
  const [topics, setTopics] = React.useState('___');
  const [user, setUser] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  const handleSignInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUpWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await firebase.auth().createUserWithPopup(provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignInWithEmailAndPassword = async () => {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUpWithEmailAndPassword = async () => {

    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Structured Voice Logger</Text>
      <AudioRecorder updateText={setTranscriptionText} updateTopics={setTopics} />
      <ChangeColor />
      <Text id="transcription-text">{transcriptionText}</Text>
      <Text id="topics-text">{topics}</Text>

      {user ? (
        <View>
          <Text>Welcome, {user.email}.</Text>
          <Button title="Sign Out" onPress={() => firebase.auth().signOut()} />
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />
          <Button title="Sign In" onPress={handleSignInWithEmailAndPassword} />
          <Button title="Sign Up" onPress={handleSignUpWithEmailAndPassword} />
          {/* <Button title="Sign In with Google" onPress={handleSignInWithGoogle} />
          <Button title="Sign Up with Google" onPress={handleSignUpWithGoogle} /> */}
        </View>
      )}

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
    const userId = firebase.auth().currentUser.uid;
    const transcriptsCollection = firebase.firestore().collection('users').doc(userId).collection('transcripts');    
    const topics = await getTopics(jsonResponseTranscript.text);
    transcriptsCollection.add({
      text: jsonResponseTranscript.text,
      topics: topics,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
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
