
import * as React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
// import RNFS from 'react-native-fs';


export default function App() {
  return (
    <View style={styles.container}>
      <Text>Structured Voice Logger?!</Text>
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
  

  // a button that starts red and turns blue when pressed
  async function changeColor() {
    if (this.state.color == 'red') {
      this.setState({color: 'blue'});
    } else {
      this.setState({color: 'red'});
    }
  }


  
  async function sendRecording(recording) {
    try {
  
      const formData = new FormData();
      formData.append('audio', {
        uri: recording.getURI(),
        type: 'audio/m4a',
        name: 'recording.m4a'
      });
      
      for (var [key, value] of formData.entries()) {
        console.log(key, value);
      }
  
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },        
      });
  
      console.log('Recording sent successfully');
    } catch (err) {
      console.error('Failed to send recording', err);
    }
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
