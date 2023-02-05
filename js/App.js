
import * as React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
// import RNFS from 'react-native-fs';


export default function App() {
  return (
    <View style={styles.container}>
      <Text>Structured Voice Logger</Text>
      <AudioRecorder />
      <ChangeColor />
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


// a button that starts red and alternates between red and blue on click
function ChangeColor() {
  const [color, setColor] = React.useState('red');
  return (
    <View>
      <Button
        title="Change Color"
        color={color}
        onPress={() => {
          setColor(color === 'red' ? 'blue' : 'red');
        }}
      />
    </View>
  );
}


// makes a button to record audio
function AudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  
  async function startRecording() {
    // request microphone permissions in a way that works on an iOS device
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
      await recording.startAsync();
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function playRecording() {
    // plays the recording in a way that will work on an iOS device
    console.log('Playing recording..');
    const { sound } = await recording.createNewLoadedSoundAsync();
    await sound.playAsync();
  }

  
  async function sendRecording(recording) {
    // sends the recording in a way that will work on an iOS device.
    playRecording();
    const uri = recording.getURI();
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `recording.${fileType}`,
      type: `audio/${fileType}`,
      extension: fileType,
    });
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    };
    // does the POST and logs the response from the server, whether it's an error or a success
    fetch('https://spherecatcher.pythonanywhere.com/upload', options)
      .then((responseJson) => {
        console.log(responseJson);
      }
    );
  }


  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
    });
    
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);

    sendRecording(recording);
  }


  // records, then uploads the recording. The recording button
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
    </View>
  );
}
