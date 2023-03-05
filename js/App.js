import * as React from "react";
import {
  Text,
  View,
  Button,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useEffect } from "react";
import { FontAwesome, Feather } from "@expo/vector-icons";

import * as firebase from "firebase";

import SignUpOrSignIn from "./Authentication.js";
import AudioRecorder from "./AudioRecorder.js";
import { TopicsList, EntriesForTopic } from "./UserDataLists.js";
import { getStyles } from "./styles.js";

styles = getStyles();

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
  measurementId: "G-5SDFE3KY7B",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);

  const handleBackPress = () => {
    setSelectedTopic(null);
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  function RecordingElements() {
    return (
      <View>
        <AudioRecorder fbase={firebase} />
      </View>
    );
  }

  function BackButton() {
    return (
      <TouchableOpacity onPress={handleBackPress}>
        <Feather name="arrow-left-circle" size={36} color="black" />
      </TouchableOpacity>
    );
  }

  function AuthStatusElements() {
    const [showMenu, setShowMenu] = React.useState(false);

    const handlePress = () => {
      setShowMenu(!showMenu);
    };

    return (
      <View>
        <TouchableOpacity onPress={handlePress}>
          <FontAwesome name="user-circle" size={34} color="black" />
        </TouchableOpacity>
        <Modal visible={showMenu} animationType="fade" transparent={true}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text>Signed in as {user.email}.</Text>
              <Button
                title="Sign Out"
                onPress={() => firebase.auth().signOut()}
              />
              <Button title="Close" onPress={handlePress} />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  function MainDisplay() {
    return (
      //   <View style={{ flex: 1, flexDirection: "column" }}>
      <View>
          <View style={styles.topContainer}>
            <TopicsList userId={user.uid} setSelectedTopic={setSelectedTopic} />
          </View>
          <View style={styles.footer}>
            <RecordingElements />
          </View>
          {/* </View> */}
      </View>
    );
  }

  function LoginPage() {
    return (
      <View style={styles.centerContainer}>
        <SignUpOrSignIn />
      </View>
    );
  }

  function HomePage() {
    return (
      <ScrollView>
        <View style={styles.headerContainer}>
          <Text style={{ fontSize: 20, paddingTop: 35 }}>{selectedTopic}</Text>
        </View>
        {!selectedTopic ? (
          <MainDisplay />
        ) : (
          <View>
            <View style={styles.container}>
              <EntriesForTopic
                userId={user.uid}
                selectedTopic={selectedTopic}
              />
            </View>
          </View>
        )}

        <View style={styles.topRightCornerFirstPositionContainer}>
          <AuthStatusElements />
        </View>
        {selectedTopic && (
          <View style={styles.topLeftCornerContainer}>
            <BackButton />
          </View>
        )}
      </ScrollView>
    );
  }

  return user ? <HomePage /> : <LoginPage />;
}
