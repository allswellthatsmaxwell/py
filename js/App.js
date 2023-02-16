
import * as React from 'react';
import { StyleSheet, Text, View, Button, TextInput, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// imports useEffect hook
import { useEffect } from 'react';

import * as firebase from 'firebase';

import SignUpOrSignIn from './Authentication.js';
import AudioRecorder from './AudioRecorder.js';


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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    padding: 20,
  },
  flatList: {
    maxHeight: '50%',
    width: '100%',
  },
});

export default function App() {
  const [transcriptionText, setTranscriptionText] = React.useState('...');
  const [topics, setTopics] = React.useState('___');

  const [user, setUser] = React.useState(null);
  
  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    user ? (
      <View style={styles.topContainer}>
        <AudioRecorder updateText={setTranscriptionText} updateTopics={setTopics} />
        <Text id="transcription-text">{transcriptionText}</Text>
        <Text id="topics-text">{topics}</Text>
  
        <View style={styles.centerContainer}>
          <TopicsList userId={user.uid} />
        </View>

        <View style={styles.bottomContainer}>
          <Text>Signed in as {user.email}.</Text>          
          <Button title="Sign Out" onPress={() => firebase.auth().signOut()} />          
        </View>
      </View>
    ) : (
      <View style={styles.centerContainer}>
        <SignUpOrSignIn />
      </View>
    )
  );
}


function TopicsList({ userId }) {
  const [topicsList, setTopicsList] = React.useState([]);

  useEffect(() => {
    const topicsCollection = firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('topics');

    const unsubscribe = topicsCollection.onSnapshot((snapshot) => {
      const topics = snapshot.docs.map((doc) => doc.id);
      console.log("userId: ", userId);      
      console.log("Topics: ", topics);
      setTopicsList(topics);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return (
    <View>
      <Text>Your logs</Text>
      <FlatList
        data={topicsList}
        renderItem={({ item }) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
        style={styles.flatList}//{{ height: 200, width: '100%', marginTop: 10 }}
        contentContainerStyle={{ backgroundColor: 'lightgray', padding: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
