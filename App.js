import * as React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import RNFS from 'react-native-fs';


export default function App() {
  return (
    <View style={styles.container}>
      <Text>Structured Voice Logger?!</Text>
      <AudioRecorder />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// const audioSaveDirectory = `${RNFS.ExternalDirectoryPath}/recordings`;



// makes a button to record audio
function AudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  
  async function startRecording() {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const audioFile = recording.getURI();

    // set the path where you want to save the recording
    const path = RNFS.DocumentDirectoryPath + '/recordings/recording.m4a';
    RNFS.copyFile(audioFile, path)
      .then(() => {
        console.log('Recording saved at:', path);
      })
      .catch((err) => {
        console.error('Failed to save recording', err);
      });
  }

  // async function saveRecording() {
  //   console.log('Saving recording..');
  //   try {
  //     await RNFS.mkdir(appDirectory);
  //     const filePath = `${audioSaveDirectory}/recording.m4a`;
  //     await RNFS.copyFile(recording.getURI(), filePath);
  //     console.log('Recording saved to', filePath);
  //   } catch (err) {
  //     console.error('Failed to save recording', err);
  //   }
  // }

  // records, then saves the recording. The recording button
  // changes to a stop button when recording.
  return (
    <View>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={async () => {
          if (isRecording) {
            await stopRecording();
          } else {
            await startRecording();
          }
          setIsRecording(!isRecording);
        }
      }
      />
      <Button
        title="Save Recording"
        onPress={async () => {
          await saveRecording();
        }
      }
      />
    </View>
  );
}
