import * as React from 'react';
import { Text, View, Button, TouchableOpacity, Modal } from 'react-native';
import { useEffect, memo } from 'react';
import { FontAwesome, Feather } from "@expo/vector-icons";

import * as firebase from 'firebase';

import SignUpOrSignIn from './Authentication.js';
import AudioRecorder from './AudioRecorder.js';
import { TopicsList, EntriesForTopic } from './UserDataLists.js';
import { getStyles } from './styles.js';

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
    measurementId: "G-5SDFE3KY7B"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export default function App() {
    const [transcriptionStatus, setTranscriptionStatus] = React.useState(null);
    const [topicsStatus, setTopicsStatus] = React.useState(null);

    const [user, setUser] = React.useState(null);
    const [selectedTopic, setSelectedTopic] = React.useState(null);

    const handleBackPress = () => {
        setSelectedTopic(null);
    };


    useEffect(() => {
        firebase.auth().onAuthStateChanged(user => {
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
                <AudioRecorder setTranscriptionStatus={setTranscriptionStatus} setTopicsStatus={setTopicsStatus} fbase={firebase} />
                <Text id="transcription-status" style={{ textAlign: 'center' }}>{transcriptionStatus}</Text>
                <Text id="topics-status" style={{ textAlign: 'center' }}>{topicsStatus}</Text>
            </View>);
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
                            <Button title="Sign Out" onPress={() => firebase.auth().signOut()} />
                            <Button title="Close" onPress={handlePress} />
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    function MainDisplay() {
        const MemoizedTopicsList = memo(() => <TopicsList userId={user.uid} setSelectedTopic={setSelectedTopic} />);

        return (
            <View>
                <View style={styles.topContainer}>
                    <MemoizedTopicsList />
                </View>

                <View style={styles.centerContainer}>
                    <RecordingElements />
                </View>
            </View>
        )
    }

    function HomePage() {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}></View>

                {!selectedTopic ? (
                    <MainDisplay />
                ) : (
                    <View>
                        <View style={styles.headerContainer}></View>
                        <EntriesForTopic userId={user.uid} selectedTopic={selectedTopic} />
                    </View>
                )}

                <View style={styles.topRightCornerFirstPositionContainer}>
                    <AuthStatusElements />
                </View>
                {selectedTopic &&
                    <View style={styles.topLeftCornerContainer}>
                        <BackButton />
                    </View>
                }
            </View>
        );
    }

    function LoginPage() {
        return (
            <View style={styles.centerContainer}>
                <SignUpOrSignIn />
            </View >
        )
    }

    return (
        user ? <HomePage /> : <LoginPage />
    );
}
