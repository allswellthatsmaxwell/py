import * as React from "react";
import {View} from "react-native";
import {useEffect} from "react";

import {createStackNavigator, CardStyleInterpolators} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';


import firebase from "firebase";

import SignUpOrSignIn from "./Authentication";
import AudioRecorder from "./AudioRecorder";
import {TopicsList} from "./TopicsList";
import {EntriesForTopic} from "./Entries";
import {TranscriptHistory} from "./TranscriptHistory";
import {Header} from "./Header";
import {getStyles} from "./styles";
import {HeaderProvider} from './HeaderContext';

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

const config = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const closeConfig = {
  ...config,
  animation: 'timing',
};

const screenOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: config,
    close: closeConfig,
  },
};

const Stack = createStackNavigator();

function AppNavigator() {
  const [user, setUser] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [historySelected, setHistorySelected] = React.useState(false);
  const [topicsData, setTopicsData] = React.useState({});

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user: any) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  function LoginPage() {
    return (
        <View style={styles.centerContainer}>
          <SignUpOrSignIn/>
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

  function HomePage({navigation}: any) {
    useEffect(() => {
      if (selectedTopic) {
        navigation.navigate('EntriesForTopic');
      }
    }, [selectedTopic, navigation]);

    return (
        <View>
          <Header navigation={navigation}/>
          {historySelected ? (
              <TranscriptHistory userId={user.uid}/>
          ) : (
              <MainDisplay/>
          )}
        </View>
    );
  }

  return (
      <NavigationContainer>
        <HeaderProvider
            value={{
              user,
              selectedTopic,
              setSelectedTopic,
              historySelected,
              setHistorySelected
            }}
        >
          <Stack.Navigator screenOptions={{headerShown: false, animationEnabled: true}}>
            {user ? (
                <>
                  <Stack.Screen name="HomePage" component={HomePage}/>
                  <Stack.Screen name="EntriesForTopic" component={EntriesForTopic}/>
                </>
            ) : (
                <Stack.Screen name="LoginPage" component={LoginPage}/>
            )}
          </Stack.Navigator>
        </HeaderProvider>
      </NavigationContainer>
  );
}

export default function App() {
  return <AppNavigator/>;
}
