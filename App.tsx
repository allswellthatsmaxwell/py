import * as React from "react";
import {
  Text,
  View,
  Button,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import {useEffect} from "react";
import {FontAwesome, Feather, AntDesign, Entypo, MaterialCommunityIcons} from "@expo/vector-icons";

import * as firebase from "firebase";

import SignUpOrSignIn from "./Authentication";
import AudioRecorder from "./AudioRecorder";
import {TopicsList} from "./TopicsList";
import {EntriesForTopic} from "./Entries";
import {getStyles} from "./styles";
import {TranscriptHistory} from "./TranscriptHistory";

const styles = getStyles();

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
  const [historySelected, setHistorySelected] = React.useState(false);
  const [topicsData, setTopicsData] = React.useState({});

  const handleBackPress = () => {
    setSelectedTopic(null);
    setHistorySelected(false);
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

  function BackButton() {
    return (
        <View style={styles.topLeftCornerContainer}>
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="arrow-left-circle" size={36} color="black"/>
          </TouchableOpacity>
        </View>
    );
  }

  function AuthStatusElements() {
    const [showMenu, setShowMenu] = React.useState(false);

    const handlePress = () => {
      setShowMenu(!showMenu);
    };

    return (
        <View style={styles.topRightCornerFirstPositionContainer}>
          <TouchableOpacity onPress={handlePress}>
            <FontAwesome name="user-circle" size={34} color="black"/>
          </TouchableOpacity>
          <Modal visible={showMenu} animationType="fade" transparent={true}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text>Signed in as {user.email}.</Text>
                <Button
                    title="Sign Out"
                    onPress={() => firebase.auth().signOut()}
                />
                <Button title="Close" onPress={handlePress}/>
              </View>
            </View>
          </Modal>
        </View>
    );
  }


  function LoginPage() {
    return (
        <View style={styles.centerContainer}>
          <SignUpOrSignIn/>
        </View>
    );
  }

  function HistoryButton() {
    return (
        <View style={styles.topRightCornerSecondPositionContainer}>
          <TouchableOpacity onPress={() => setHistorySelected(true)}>
            <MaterialCommunityIcons name="file-document-multiple" size={34} color="black"/>
          </TouchableOpacity>
        </View>
    );
  }

  function Header() {
    return (
        <View style={styles.headerContainer}>
          <AuthStatusElements/>
          <HistoryButton/>

          {(selectedTopic || historySelected) && (<BackButton/>)}
        </View>
    );
  }

  function MainDisplay() {
    return (
        <View>
          <View style={[styles.topContainer, {height: 600}]}>
            <TopicsList userId={user.uid}
                        setSelectedTopic={setSelectedTopic}
                        topicsData={topicsData}
                        setTopicsData={setTopicsData}/>
          </View>
          <View style={styles.footer}>
            <AudioRecorder fbase={firebase} setSelectedTopic={setSelectedTopic}/>
          </View>
        </View>
    );
  }

  function HomePage() {

    return (
        <View>
          <Header/>
          {selectedTopic ? (
              <EntriesForTopic userId={user.uid} selectedTopic={selectedTopic}/>
          ) : historySelected ? (
              <TranscriptHistory userId={user.uid}/>
          ) : (
              <MainDisplay/>
          )}
        </View>
    );
  }

  return user ? <HomePage/> : <LoginPage/>;
}
