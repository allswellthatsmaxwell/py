
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

from pathlib import Path
import os

class TopicMatcherPrompt:
    input_variables = ["transcript", "files"]
        
    prompt_text = """Complete the final entry, and only the final entry. Do not add any entries.
{{transcript: "walked two miles today", existing: "walking distance, wake up time", topics: {{"walking distance (miles)": 2}}}}
{{transcript: "woke up at 09:42 A.m and had 300 milligrams of caffeine", existing: walking distance, wake up time, topics: {{"wake up time": "09:42", "caffeine (mg)": 300}}}}
{{transcript: "woke up at twelve thirty pm", existing: walking distance, wake up time, topics: {{"wake up time": "12:30"}}}}
{{transcript: "went to bed at 2am and woke up at 10am", existing: "walking distance, wake up time", topics: {{"wake up time": "02:00", "hours slept": 8}}}}
{{transcript: "ate four hundred calories", existing: "walking distance, wake up time", topics: {{"calories": 400}}}}
{{transcript: "Today I ate three apples", existing: "alcoholic beverages, wake up time", topics: {{"apples": 3}}}}
{{transcript: "Today I ate 7 apples and had 6 ounces of alcohol", existing: "", topics: {{"apples": 7, "alcohol (oz)": 6}}}}
{{transcript: "Today I ate three apples and two oranges and two alcoholic drinks", existing: "", topics: {{"apples": 3, "oranges": 2, "alcohol (drinks)": 2}}}}
{{transcript: "I listened to rap music for two and a half hours today", existing: "", topics: {{"rap music listening time": 2.5}}}}
{{transcript: "{transcript}", existing: "{files}", topics:"""


class LogFilesFinder:
    def __init__(self, transcript_text: str, logs_dir: Path, llm: OpenAI = None) -> None:
        self.transcript_text = transcript_text
        self.log_files_dir = logs_dir
        os.makedirs(self.log_files_dir, exist_ok=True)
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
        p = self.prompt_template.format(files=self.file_options, transcript=self.transcript_text)
        print(p)
        return p
    
    @property
    def relevant_files(self) -> str:
        completion = self.llm(self.prompt)
        completion = completion.strip().strip('}').strip('{')
        completion = "{" + completion + "}"
        print(completion)
        return completion.strip()
