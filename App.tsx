import * as React from "react";
import {View} from "react-native";
import {useEffect} from "react";
import Constants from 'expo-constants';

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
  apiKey: Constants.manifest.extra.apiKey,
  authDomain: Constants.manifest.extra.authDomain,
  projectId: Constants.manifest.extra.projectId,
  storageBucket: Constants.manifest.extra.storageBucket,
  messagingSenderId: Constants.manifest.extra.messagingSenderId,
  appId: Constants.manifest.extra.appId,
  measurementId: Constants.manifest.extra.measurementId,
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
  headerShown: false,
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
        <View style={styles.loginWrapContainer}>
          <SignUpOrSignIn/>
        </View>
    );
  }


  function MainDisplay() {
    return (
        <View>
          <View style={[styles.topContainer, {height: 600}]}>
            <TopicsList userId={user.uid}
                        setSelectedTopic={setSelectedTopic}/>
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
        navigation.navigate("EntriesForTopic");
      }
    }, [selectedTopic, navigation]);

    useEffect(() => {
      if (historySelected) {
        navigation.navigate("TranscriptHistory", {userId: user.uid, historySelected: historySelected});
      }
    }, [historySelected, navigation]);

    return (
        <View style={styles.globalBackground}>
          <Header navigation={navigation}/>
          <MainDisplay/>
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
          <Stack.Navigator screenOptions={screenOptions}>
            {user ? (
                <>
                  <Stack.Screen name="HomePage" component={HomePage}/>
                  <Stack.Screen name="EntriesForTopic" component={EntriesForTopic}/>
                  <Stack.Screen name="TranscriptHistory" component={TranscriptHistory}/>
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
