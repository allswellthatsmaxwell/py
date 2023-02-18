import * as React from 'react';
import { StyleSheet, Text, View, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// imports useEffect hook
import { useEffect } from 'react';
import { Table, Row, Col } from 'react-native-table-component';


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

  // state to keep track of the selected topic
  const [selectedTopic, setSelectedTopic] = React.useState(null);

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

  const handleTopicPress = (topic) => {
    setSelectedTopic(topic);
  };

  const handleBackPress = () => {
    setSelectedTopic(null);
  };

  // if a topic is selected, show the logs from that topic
  if (selectedTopic) {
    return (
      <View style={styles.topContainer}>
        <Text style={{ fontSize: 20 }}>{selectedTopic}</Text>
        <Button title="Back to Topics" onPress={handleBackPress} />
        <LogsList userId={userId} topic={selectedTopic} />
      </View>
    );
  }

  // if no topic is selected, show the list of topics
  return (
    <View>
      <Text>Your logs</Text>
      <FlatList
        data={topicsList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleTopicPress(item)}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        style={styles.flatList}
        contentContainerStyle={{ backgroundColor: 'lightgray', padding: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function LogsList({ userId, topic }) {
  const [logsList, setLogsList] = React.useState([]);

  useEffect(() => {
    const logsCollection = firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('topics')
      .doc(topic)
      .collection('entries');

    const unsubscribe = logsCollection.onSnapshot((snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Logs: ", logs);
      setLogsList(logs);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, topic]);

  return (
    <View>
      <FlatList
        data={logsList}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 5, flexDirection: 'row'}}>
            <Text>{item.number}</Text>
            <Text>{item.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={{ height: 200, width: '100%' }} // {styles.flatList}
        contentContainerStyle={{ backgroundColor: 'lightgray', padding: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}