import * as React from 'react';
import {View, Button, TextInput, StyleSheet, Text} from 'react-native';
import * as firebase from 'firebase';


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
    // alignItems: 'center',
    // justifyContent: 'center',
    // marginLeft: 70,
    height: 100,
    // height: "50%"
  },
  inputContainer: {
    width: 120,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C1B299', // Tan border color
    backgroundColor: '#FFF7ED', // Soft beige background color
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#000000', // Dark tan text color
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

function SignUpOrSignIn() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSignInWithEmailAndPassword = async () => {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUpWithEmailAndPassword = async () => {
    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
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
          <Button title="Sign In" onPress={handleSignInWithEmailAndPassword} color={styles.buttonText.color}/>
        </View>
        <View style={styles.button}>
          <Button title="Sign Up" onPress={handleSignUpWithEmailAndPassword} color={styles.buttonText.color}/>
        </View>
        {/* <Button title="Sign In with Google" onPress={handleSignInWithGoogle} />
      <Button title="Sign Up with Google" onPress={handleSignUpWithGoogle} /> */}
      </View>
</View>
)
  ;
}

export default SignUpOrSignIn;