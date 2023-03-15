import os, requests
from pathlib import Path

from deepgram import Deepgram
import asyncio, json, mimetypes
import openai

DEEPGRAM_API_KEY = os.environ['DEEPGRAM_API_KEY']

def read_file(filename, chunk_size=5242880):
    with open(filename, 'rb') as _file:
        while True:
            data = _file.read(chunk_size)
            if not data:
                break
            yield data


class DeepgramTranscriber:
    def __init__(self) -> None:
        self.deepgram = Deepgram(DEEPGRAM_API_KEY)
        
    async def transcribe(self, file):
        # mimetype, _ = mimetypes.guess_type(file)
        mimetype = 'audio/m4a'
        print(f"mimetype: {mimetype} for file {file}")

        with open(file, 'rb') as audio:
            source = {'buffer': audio, 'mimetype': mimetype}
            response = await self.deepgram.transcription.prerecorded(source, {'punctuate': False})
            print(json.dumps(response, indent=4))
        return response
    

class WhisperTranscriber:
    async def transcribe(self, file):
        with open(file, 'rb') as audio:
            transcript = openai.Audio.transcribe("whisper-1", audio)
        print(json.dumps(transcript, indent=4))
        return transcript
        


# HEADERS = { "Authorization": os.environ["ASSEMBLY_AI_API_KEY"] }

# class Transcriber:
#     def __init__(self, audio_dir: Path=None, audio_extension='.m4a') -> None:
#         self.audio_dir = audio_dir
#         self.audio_extension = audio_extension
    
#     def get_file_substring_match(self, target_fname: str):
#         audio_files = [os.path.join(self.audio_dir, f) 
#                        for f in os.listdir(self.audio_dir) if f.endswith(self.audio_extension)]
#         audio_file = [f for f in audio_files if target_fname in f]
#         assert len(audio_file) == 1
#         return audio_file[0]
    
#     def upload(self, audio_file: str) -> str:
#         endpoint = "https://api.assemblyai.com/v2/upload"
#         response = requests.post(endpoint, headers=HEADERS, data=read_file(audio_file))
#         return response.json()["upload_url"]
    
#     # def upload_and_kickoff(self, audio_file: str) -> str:
#     #     return self._kickoff(self.upload(audio_file))
    
#     def _poll(self, transcription_id: str):
#         endpoint = f"https://api.assemblyai.com/v2/transcript/{transcription_id}"
#         status = "processing"
#         while status not in ("completed", "error"):
#             response = requests.get(endpoint, headers=HEADERS)
#             if "status" not in response.json():
#                 raise ValueError(f"No status in response: {response.json()}")
#             status = response.json()["status"]
#         return response.json()
    
#     def transcribe(self, audio_file: str) -> Dict:
#         return self._poll(self._kickoff(self.upload(audio_file)))
    


# def kickoff(url: str) -> str:
#     endpoint = "https://api.assemblyai.com/v2/transcript"
#     json = { "audio_url": url }
#     response = requests.post(endpoint, json=json, headers=HEADERS)
#     return response.json()["id"]