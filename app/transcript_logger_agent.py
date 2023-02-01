
""" This way didn't work - I'm not using this file. """

from langchain import LLMChain
from langchain.agents import initialize_agent, Tool, ZeroShotAgent, AgentExecutor


TOOLS = [
    # Tool(
    #     name="list_files",
    #     func=get_files_list,
    #     description="Lists all the log files that currently exist for the user."),
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
    
### Scratchpad ###
    {agent_scratchpad}
"""

    
    def __init__(self, transcript: str, logs_dir: Path, llm: OpenAI, files=None) -> None:
        self.transcript = transcript
        self.logs_dir = logs_dir
        self.files = files
        self.llm = llm
        chain = LLMChain(llm=llm, prompt=self.prompt_template)
        self.agent = ZeroShotAgent(llm_chain=chain, tools=TOOLS)


    @property
    def prompt_template(self):
        return ZeroShotAgent.create_prompt(
            TOOLS, 
            prefix=self.prompt_prefix, 
            suffix=self.prompt_suffix, 
            input_variables=["relevant_files", "transcript", "agent_scratchpad"])
        
    def write_to_files(self):
        agent_executor = AgentExecutor.from_agent_and_tools(agent=self.agent, tools=TOOLS, verbose=True)
        agent_executor.run(transcript=self.transcript, relevant_files=self.relevant_files)
    
    def relevant_files(self):
        if not self.files:
            self.files = LogFilesFinder(self.transcript, Path(self.logs_dir), self.llm).relevant_files
        return self.files