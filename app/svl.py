
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

from pathlib import Path
import os
import json

from typing import List, Dict
import requests


def get_files_list(logs_dir: Path):
    return ", ".join([f"{f}" for f in os.listdir(logs_dir)])


def view_csv(csv_file: Path):
    """ returns the first 4 lines of a csv file. If the file has less than 4 lines, returns all the lines."""
    with open(csv_file) as f:
        lines = [f"    {line}" for line in f.readlines()]
        return "".join(lines[:4])
    
        
def append_to_csv(csv_file: Path, row: str):
    with open(csv_file, 'a') as f:
        f.write(row)
        f.write("\n")
    

class TranscriptLogger:
    _prompt_text = """
## Instructions ##
    Your objective is to write log entries for a user, based on an audio transcript.
    The user who recorded the audio is trying to log something, or multiple somethings. It is also possible the transcript is not trying to log anything.
    If it's trying to log something, write a log entry for each thing the user is trying to log.
    I will give you a list of files that correspond to topics that can be logged to. Log the right thing to the right file.
    
## Output Structure ##
    Output a JSON object where each key is a file name and each value is the log entry for that file.
    If the user is not trying to log anything, output an empty JSON object.
    
## Relevant files, and samples of their contents ##
{content_previews}

### Transcript ###
    {transcript}
    
### Output ###
"""

    
    def __init__(self, transcript_text: str, logs_dir: Path, llm: OpenAI, files=None) -> None:
        self.transcript_text = transcript_text
        self.logs_dir = logs_dir
        self.files = files
        self.llm = llm
        self.completion = None


    @property
    def _prompt_template(self):
        return PromptTemplate(input_variables=["content_previews", "transcript"],
                              template=self._prompt_text)
        
    @property
    def _content_previews(self):
        heads = [f"    {f}:\n\n{view_csv(f)}" for f in self._relevant_files]
        
        return "\n".join(heads).replace('"', '\\"')
        
    @property
    def _prompt(self):
        return self._prompt_template.format(content_previews=self._content_previews,
                                            transcript=self.transcript_text)
        
    def get_completion(self):
        if not self.completion:
            self.completion = self.llm(self._prompt)        
        return self.completion
    
    def get_json_completion(self):
        return json.loads(self.get_completion())
    
    @property
    def _relevant_files(self) -> List[str]:
        if not self.files:
            self.files = LogFilesFinder(self.transcript_text, Path(self.logs_dir), self.llm).relevant_files
        return [os.path.join(self.logs_dir, f.strip())
                for f in self.files.split(',')]
    

class LogFilesFinder:
    
    prompt_text = """
## Instructions ##
    Your objective is to report which of a list of files corresponds to an audio transcript. 
    The user who recorded the audio is trying to log something, or multiple somethings, and the files I'll give you correspond to topics that can be logged to.

    The user may be trying to log multiple things at once. If so, report every file that corresponds to a topic that can be logged to. 
    Report only the files that the user is trying to log to, separated by a comma, and nothing more.
    If you can't identify anything the transcript might be trying to log, report "NO_TOPIC_IDENTIFIED_IN_TRANSCRIPT", and nothing else.

## files for the existing log topics ##
    {files}
 
 ## Transcript ##
    {transcript}

## Files that correspond to the transcript ##
"""

    def __init__(self, transcript_text: str, logs_dir: Path, llm: OpenAI) -> None:
        self.transcript_text = transcript_text
        self.log_files_dir = logs_dir
        self.llm = llm
        self.prompt_template = PromptTemplate(input_variables=["files", "transcript"],
                                              template=self.prompt_text)
        
    @property
    def file_options(self):
        return ", ".join([f"{f}" for f in os.listdir(self.log_files_dir)])

    @property
    def prompt(self):
        return self.prompt_template.format(files=self.file_options, transcript=self.transcript_text)
    
    @property
    def relevant_files(self):
        return self.llm(self.prompt)
    
    
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
        # print(response.json())
        return response.json()["upload_url"]
    
    def _kickoff(self, url: str) -> str:
        endpoint = "https://api.assemblyai.com/v2/transcript"
        json = { "audio_url": url }
        response = requests.post(endpoint, json=json, headers=self.headers)
        # print(response.json())
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
