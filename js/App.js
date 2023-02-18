import * as React from 'react';
import { StyleSheet, Text, View, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// imports useEffect hook
import { useEffect } from 'react';
import { Table, Row, Rows } from 'react-native-table-component';


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
        <LogsList userId={userId} topic={selectedTopic} />
        <Button title="Back" onPress={handleBackPress} />
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

    const transactionFunction = async (transaction, doc) => {
      const logRef = logsCollection.doc(doc.id);
      const log = await transaction.get(logRef);
      return { id: log.id, ...log.data() };
    };
  
    const unsubscribe = logsCollection.onSnapshot((snapshot) => {
      firebase.firestore().runTransaction(async (transaction) => {
        const logs = [];
        for (const doc of snapshot.docs) {
          const log = await transactionFunction(transaction, doc);
          logs.push(log);
        }
        console.log("Logs: ", logs);
        setLogsList(logs);
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, [userId, topic]);

  
  const tableHead = ['Date', 'Time', 'Value'];
  // formats like "July 6, 11:36 PM"
  const time_format = {hour: '2-digit', minute:'2-digit', hour12: true};
  const day_format = {month: 'short', day: 'numeric'};
  const tableData = logsList.map(
    log => [
      log.timestamp.toDate().toLocaleDateString([], day_format),
      log.timestamp.toDate().toLocaleTimeString([], time_format),
      log.number]);

  return (
    <View style={{ height: 100, width: 300 }}>
      <Table style={{ width: '100%' }} borderStyle={{ borderWidth: 1, borderColor: '#bbb' }}>
        <Row data={tableHead} style={{ backgroundColor: '#f1f8ff'}} textStyle={{ margin: 1 }}/>
        <Rows data={tableData} textStyle={{ margin: 1 }} />
      </Table>
    </View>
  );
}