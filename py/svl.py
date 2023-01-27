
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.agents import initialize_agent, Tool, ZeroShotAgent, AgentExecutor

import whisper

from pathlib import Path
import os


def get_files_list(logs_dir: Path):
    return ", ".join([f"{f}" for f in os.listdir(logs_dir)])


def view_csv(csv_file: Path):
    """ returns the first 4 lines of a csv file. If the file has less than 4 lines, returns all the lines."""
    with open(csv_file) as f:
        lines = f.readlines()
        return "\n".join(lines[:4])
    
        
def append_to_csv(csv_file: Path, row: str):
    with open(csv_file, 'a') as f:
        f.write(row)
        f.write("\n")
    

TOOLS = [
    Tool(
        name="list_files",
        func=get_files_list,
        description="Lists all the log files that currently exist for the user."),
    Tool(name = "view_csv",
         func = view_csv,
         description="Shows the header and the first few lines of a csv file. Useful for seeing how the csv is formatted and what fields it has."),
    Tool(name="append_to_csv",
         func=append_to_csv,
         description="Appends a row to a csv file. Useful for adding a new log entry to a csv file.")
    ]


class TranscriptLogger:
    prompt_prefix = """
## Instructions ##
    Your objective is to write log entries for a user, based on an audio transcript.
    The user who recorded the audio is trying to log something, or multiple somethings. It is also possible the transcript is not trying to log anything.
    If it's trying to log something, write a log entry for each thing the user is trying to log.
    I will give you a list of files that correspond to topics that can be logged to. Log the right thing to the right file.
    
    For now, do not actually write to disk. Instead, just report what you would add to each file.
"""

    prompt_suffix = """

## relevant files ##
    {relevant_files}

### Transcript ###
    {transcript}
"""

    
    def __init__(self, transcript: str, logs_dir: Path, llm: OpenAI) -> None:
        self.transcript = transcript
        self.logs_dir = logs_dir
        self.llm = llm
        self.agent = initialize_agent(TOOLS, llm, agent="zero-shot-react-description", verbose=True)

    @property
    def prompt(self):
        return ZeroShotAgent.create_prompt(
            TOOLS, 
            prefix=self.prompt_prefix, 
            suffix=self.prompt_suffix, 
            input_variables=["files", "transcript", "agent_scratchpad"])
        
    def write_to_files(self):
        agent_executor = AgentExecutor.from_agent_and_tools(agent=self.agent, tools=TOOLS, verbose=True)
        agent_executor.run(transcript=self.transcript, relevant_files=self.relevant_files)
    
    def relevant_files(self):
        files_finder = LogFilesFinder(self.transcript, Path(self.logs_dir), self.llm)
        return files_finder.relevant_files
    

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