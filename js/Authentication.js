
import * as React from 'react';
import { View, Button, TextInput } from 'react-native';
import * as firebase from 'firebase';


function SignUpOrSignIn() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSignInWithEmailAndPassword = async () => {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            setUser(result.user);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSignUpWithEmailAndPassword = async () => {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            setUser(result.user);
        } catch (error) {
            // display a toast with the error message

        }
    };

    const handleSignInWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            setUser(result.user);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSignUpWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().createUserWithPopup(provider);
            setUser(result.user);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
            />
            <TextInput
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
            />
            <Button title="Sign In" onPress={handleSignInWithEmailAndPassword} />
            <Button title="Sign Up" onPress={handleSignUpWithEmailAndPassword} />
            {/* <Button title="Sign In with Google" onPress={handleSignInWithGoogle} />
      <Button title="Sign Up with Google" onPress={handleSignUpWithGoogle} /> */}
        </View>
    );
}

export default SignUpOrSignIn;