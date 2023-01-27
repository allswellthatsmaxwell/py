
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.agents import initialize_agent, Tool

import whisper

from pathlib import Path
import os

def get_files_list(logs_dir: Path):
    return ", ".join([f"{f}" for f in os.listdir(logs_dir)])

TOOLS = [
    Tool(
        name = "list_files",
        func = get_files_list,
        description = "Lists all the log files that currently exist for the user."
    )]


class TranscriptLogger:
    def __init__(self, transcript: str) -> None:
        self.transcript = transcript
    

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

    def __init__(self, transcript_text: str, log_files_dir: Path, llm: OpenAI) -> None:
        self.transcript_text = transcript_text
        self.log_files_dir = log_files_dir
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
    def recommended_files(self):
        return self.llm(self.prompt)
    
    

class Transcriber:
    def __init__(self, whisper_model: whisper.model.Whisper, audio_dir: Path, audio_extension='.m4a') -> None:
        self.whisper_model = whisper_model
        self.audio_dir = audio_dir
        self.audio_extension = audio_extension
    
    def transcribe(self, target_fname: str):
        audio_files = [os.path.join(self.audio_dir, f) 
                       for f in os.listdir(self.audio_dir) if f.endswith(self.audio_extension)]
        audio_file = [f for f in audio_files if target_fname in f]
        assert len(audio_file) == 1
        audio_file = audio_file[0]
        return self.whisper_model.transcribe(audio_file)