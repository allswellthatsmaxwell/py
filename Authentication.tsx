import * as React from 'react';
import { View, Button, TextInput, StyleSheet, Text } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import { useUploadContext } from './UploadContext';

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Light beige background color
  },
  textContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    // fontFamily: 'Poppins-Bold', // Use the custom font
    color: '#E3A869', // Dark tan text color
    marginBottom: 20, // Add some space below the title
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginLeft: 55,
    height: 100,
  },
  inputContainer: {
    width: 320,
    height: 40,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C1B299', // Tan border color
    backgroundColor: '#FFF7ED', // Soft beige background color
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 18,
    color: '#000000',
  },
  button: {
    width: '80%',
    marginBottom: 10,
    backgroundColor: '#E3A869', // Tan background color
    borderRadius: 5,
  },
  buttonText: {
    textAlign: 'center',
    paddingVertical: 5,
    color: '#FFF7ED', // Soft beige text color
  },
});


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


// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });
const auth = getAuth(app);


const { setUploadComplete } = useUploadContext();

const uploadExampleData = async (user: any) => {  

  const db = getFirestore();

  console.log("in uploadExampleData");

  if (user) {
    console.log("uploadExampleData: user not null");
    // The user has been created, and now you can add example data to Firestore
    const userId = user.uid; // Unique ID for the signed-up user
    console.log("uploadExampleData: userId: " + userId);

    const topicsCollectionRef = collection(db, 'users', userId, 'topics');

    // Here, we add an example topic for the new user, named 'miles walked'
    const exampleTopicRef = doc(topicsCollectionRef, 'miles walked');
    await setDoc(exampleTopicRef, {
      // any initial data, for example:
      createdAt: Timestamp.fromDate(new Date()),
    });
    // Create a new entry document reference within the 'entries' subcollection
    const exampleEntryRef = collection(exampleTopicRef, 'entries'); // Example data to be added for the new user

    const entryData = {
      date: "2023-03-28",
      log_time: Timestamp.fromDate(new Date('2023-03-28T21:41:58-05:00')), // Using Timestamp from the modular SDK
      time: "21:41",
      transcript: "Example transcript for Lima beans.",
      value: 1
    };

    await setDoc(doc(exampleEntryRef), entryData);
  } else {
    console.log("uploadExampleData: user null");
  }
  setUploadComplete(true);
  console.log("uploadExampleData: finished");
};


function SignUpOrSignIn() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSignInWithEmailAndPassword = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUpWithEmailAndPassword = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await uploadExampleData(userCredential.user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View>
      <Text style={styles.title}>Sonic Scribe</Text>
      <View style={styles.centerContainer}>
        {/*<Text style={styles.textContainer}>Sign in to view your logs, or make an account to begin.</Text>*/}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <View style={styles.button}>
          <Button title="Sign In" onPress={handleSignInWithEmailAndPassword} color={styles.buttonText.color} />
        </View>
        <View style={styles.button}>
          <Button title="Sign Up" onPress={handleSignUpWithEmailAndPassword} color={styles.buttonText.color} />
        </View>
        {/* <Button title="Sign In with Google" onPress={handleSignInWithGoogle} />
      <Button title="Sign Up with Google" onPress={handleSignUpWithGoogle} /> */}
      </View>
    </View>
  )
    ;
}

export default SignUpOrSignIn;