
import * as React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
// import RNFS from 'react-native-fs';
// import FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system';


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

// uses expo-file-system to specify the recordings directory
const audioSaveDirectory = `${FileSystem.documentDirectory}/recordings`;


// makes a button to record audio
function AudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recording, setRecording] = React.useState();

  
  async function startRecording() {
    try {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
          console.log("Microphone access granted");
        })
        .catch(function(error) {
          console.error("Microphone access denied", error);
      });
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
    
    // saveRecording(recording);
    
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);

    sendRecording(recording);
  }

  async function drawRecording(recording) {
    // draws the sound wave of the recording
  
    function drawWaveform(data) {
      // draw the waveform
      const canvas = document.getElementById('waveform');
      const canvasCtx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / data.length;
      let barHeight;
      let x = 0;
  
      for (let i = 0; i < data.length; i++) {
        barHeight = data[i] / 2;
  
        canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight);
  
        x += barWidth + 1;
      }
    }

    const { sound, status } = await recording.createNewLoadedSoundAsync({
      isLooping: true,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
    });
    const data = await sound.getPeakPCMAsync();
    drawWaveform(data);
  }


  async function saveRecording(recording) {
    console.log('Saving recording..');
    try {
      await FileSystem.makeDirectoryAsync(audioSaveDirectory, {
        intermediates: true,
      });
      const filePath = `${audioSaveDirectory}/recording.m4a`;
      await FileSystem.moveAsync({
        from: recording.getURI(),
        to: filePath,
      });
      console.log('Recording saved to', filePath);
    } catch (err) {
      console.error('Failed to save recording', err);
    }
  }

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
