import wave
import sys
import pathlib

import pyaudio

RECORDINGS_DIR = "../recordings/"

class Recorder:
    def __init__(self, channels=1, rate=44100, chunk=1024, format=pyaudio.paInt16,
                 recordings_dir=RECORDINGS_DIR):
        self.channels = channels
        self.rate = rate
        self.chunk = chunk
        self.format = format
        self.recordings_dir = recordings_dir

    def record(self, name, record_seconds=5):
        with wave.open(pathlib.Path(self.recordings_dir, f'{name}.wav'), 'wb') as wf:
            p = pyaudio.PyAudio()
            wf.setnchannels(self.channels)
            wf.setsampwidth(p.get_sample_size(self.format))
            wf.setframerate(self.rate)

            stream = p.open(format=self.format, channels=self.channels,
                            rate=self.rate, input=True)

            print('Recording...', end=' ')
            for _ in range(0, self.rate // self.chunk * record_seconds):
                wf.writeframes(stream.read(self.chunk))
            print('done.')

            stream.close()
            p.terminate()
