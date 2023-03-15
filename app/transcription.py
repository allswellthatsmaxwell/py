import os

import asyncio, json
import openai


class WhisperTranscriber:
    async def transcribe(self, file):
        with open(file, 'rb') as audio:
            transcript = openai.Audio.transcribe("whisper-1", audio)
        print(json.dumps(transcript, indent=4))
        return transcript