
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


class TopicCreatorPrompt:
    input_variables = ["transcript"]
    
    prompt_text =  """
# Context
    You're helping behind the scenes for a personal logging app. People log things they want to keep track of, 
    by recording audio. I'll give you the transcript for some audio, and you will output a good topic name 
    (or multiple topic names, if the user is trying to log multiple things at once). Output the topic name as a .csv file, 
    with all-lowercase and underscores instead of spaces, and .csv extension.
# If there's no matching topic
    If the transcript doesn't match any existing topics, output a new topic name, well-suited for the transcript.
# Examples
    {transcript: "walked two miles today", existing: "walking_distance.csv, wake_up_time.csv", 
     topics: "walking_distance.csv"}
    {transcript: "woke up at 10am", existing: "walking_distance.csv, wake_up_time.csv", 
     topics: "wake_up_time.csv"}
    {transcript: "went to bed at 2am and woke up at 10am", existing: "walking_distance.csv, wake_up_time.csv", 
     topics: "wake_up_time.csv, hours_slept.csv"}
    {transcript: "ate 400 calories", existing: "walking_distance.csv, wake_up_time.csv", 
     topics: "calories.csv"}
    {transcript: "Today I ate three apples", existing: "alcoholic_beverages.csv, wake_up_time.csv", 
     topics: "apples.csv"}
    
    

# Transcript
    {transcript}
# Topics
"""

class TopicMatcherPrompt:
    input_variables = ["transcript", "files"]
        
    prompt_text = """Complete the final entry.
{{transcript: "walked two miles today", existing: "walking distance, wake up time", topics: walking distance}}
{{transcript: "woke up at 10am", existing: walking distance, wake up time, topics: wake up time}}
{{transcript: "went to bed at 2am and woke up at 10am", existing: "walking distance, wake up time", topics: wake up time, hours slept}}
{{transcript: "ate 400 calories", existing: "walking distance, wake up time", topics: calories}}
{{transcript: "Today I ate three apples", existing: "alcoholic beverages, wake up time", topics: apples}}
{{transcript: "Today I ate three apples", existing: "", topics: apples}}
{{transcript: "Today I ate three apples and two oranges", existing: "", topics: apples, oranges}}
{{transcript: "{transcript}", existing: "{files}", topics:"""

# ### Improper logging attempt    
#     If you can't identify anything the transcript might be trying to log, 
#     regardless of whether there is a corresponding file,
#     report "NO_TOPIC_IDENTIFIED_IN_TRANSCRIPT", and nothing else.


class LogFilesFinder:
    def __init__(self, transcript_text: str, logs_dir: Path, llm: OpenAI = None) -> None:
        self.transcript_text = transcript_text
        self.log_files_dir = logs_dir
        os.makedirs(self.log_files_dir, exist_ok=True)
        # self.prompt = TopicCreatorPrompt() if is_empty_directory(self.log_files_dir) else TopicMatcherPrompt()
        prompt = TopicMatcherPrompt()
        if llm is None:
            llm = OpenAI(temperature=0)
        self.llm = llm
        self.prompt_template = PromptTemplate(input_variables=prompt.input_variables,
                                              template=prompt.prompt_text)
        
    @property
    def file_options(self):
        return ", ".join([f"{f}" for f in os.listdir(self.log_files_dir)])

    @property
    def prompt(self):
        return self.prompt_template.format(files=self.file_options, transcript=self.transcript_text)
    
    @property
    def relevant_files(self) -> str:
        completion = self.llm(self.prompt)
        return completion.strip('}').strip()
        



def is_empty_directory(path: Path):
    # returns true iff the directory has 0 csv files
    return len([f for f in os.listdir(path) if f.endswith(".csv")]) == 0