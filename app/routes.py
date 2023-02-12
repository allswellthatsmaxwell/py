from flask import request, Blueprint, Flask, make_response

import os
from typing import Dict
import celery

from . import filesystem, transcription
from .svl import LogFilesFinder

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)


HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"
LOGFILES_DIR = f"{APPDATA_PATH}/logfiles"

filesystem = filesystem.FileSystem(root=APPDATA_PATH)


@app_routes.route("/upload", methods=["POST"])
def recording():
    # saves an audio file to the filesystem, returns the transcription
    print("Entering routes.recording...")
    
    audio_file = request.files['file']
    audio_data = audio_file.read()
    extension = audio_file.filename.split(".")[-1]
    app.logger.info(f"extension: {extension}")
    
    dest_dir = os.path.join(filesystem.root, "recordings")
    os.makedirs(dest_dir, exist_ok=True)
    
    destpath = f"{dest_dir}/rec1.{extension}"
    app.logger.info(f"Writing to '{destpath}'.")
    with open(destpath, "wb") as f:
        f.write(audio_data)
    app.logger.info("Done writing.")
    
    task = transcribe_task.apply_async(args=[destpath])
    app.logger.info(f'Transcription task started with task_id: {task.id}')

    return make_response({'task_id': task.id})

@celery.task
def transcribe_task(destpath):
    transcript = transcribe(destpath)
    text = transcript['text']
    app.logger.info(f'transcript: "{text}"')

    return transcript

# an endpoint that takes a transcript and returns a list of topics
@app_routes.route("/topics", methods=["POST"])
def topics():
    transcript = request.get_json()
    text = transcript['text']
    file_finder = LogFilesFinder(text, LOGFILES_DIR)
    topics = {'topics': file_finder.relevant_files}
    return make_response(topics)


def transcribe(audio_file: str) -> Dict:
    transcriber = transcription.Transcriber(audio_dir=f"{filesystem.root}/recordings")
    transcript = transcriber.transcribe(audio_file)
    app.logger.info(f'transcript: "{transcript}"')
    return transcript
