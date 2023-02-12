import * as firebase from 'firebase/app';
import 'firebase/auth';

const provider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    return result.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const signUpWithGoogle = async () => {
  try {
    const result = await firebase.auth().createUserWithPopup(provider);
    return result.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};