import os, requests
from typing import Dict


def read_file(filename, chunk_size=5242880):
    with open(filename, 'rb') as _file:
        while True:
            data = _file.read(chunk_size)
            if not data:
                break
            yield data


class Transcriber:
    headers = { "Authorization": os.environ["ASSEMBLY_AI_API_KEY"] }
    
    def __init__(self, audio_dir: Path=None, audio_extension='.m4a') -> None:
        self.audio_dir = audio_dir
        self.audio_extension = audio_extension
    
    def get_file_substring_match(self, target_fname: str):
        audio_files = [os.path.join(self.audio_dir, f) 
                       for f in os.listdir(self.audio_dir) if f.endswith(self.audio_extension)]
        audio_file = [f for f in audio_files if target_fname in f]
        assert len(audio_file) == 1
        return audio_file[0]
    
    def _upload(self, audio_file: str) -> str:
        endpoint = "https://api.assemblyai.com/v2/upload"
        response = requests.post(endpoint, headers=self.headers, data=read_file(audio_file))
        return response.json()["upload_url"]
    
    def _kickoff(self, url: str) -> str:
        endpoint = "https://api.assemblyai.com/v2/transcript"
        json = { "audio_url": url }
        response = requests.post(endpoint, json=json, headers=self.headers)
        return response.json()["id"]
    
    def _poll(self, transcription_id: str):
        endpoint = f"https://api.assemblyai.com/v2/transcript/{transcription_id}"
        status = "processing"
        while status not in ("completed", "error"):
            response = requests.get(endpoint, headers=self.headers)
            if "status" not in response.json():
                raise ValueError(f"No status in response: {response.json()}")
            status = response.json()["status"]
        return response.json()
    
    def transcribe(self, audio_file: str) -> Dict:
        return self._poll(self._kickoff(self._upload(audio_file)))