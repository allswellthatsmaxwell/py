from flask import request, Blueprint, Flask, make_response
from celery import Celery

import os
from typing import Dict

from . import filesystem, transcriber

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)

mq = Celery('tasks', broker='redis://localhost:6379/0')


HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"

filesystem = filesystem.FileSystem(root=APPDATA_PATH)

 
@app_routes.route("/upload", methods=["POST"])
def recording():
    # saves an audio file to the filesystem, returns the filename
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
    
    transcript = transcribe(destpath)
    app.logger.info(f'transcript: "{transcript}"')
    # return make_response(transcript["text"])
     
    task = transcribe.apply_async(args=[destpath])
    app.logger.info(f"Transcribing. Task ID: {task.id}")
    return make_response(task.id)


@mq.task
def transcribe(audio_file: str) -> Dict:
    ts = transcriber.Transcriber(audio_dir=f"{filesystem.root}/recordings")
    transcript = ts.transcribe(audio_file)
    app.logger.info(f'transcript: "{transcript}"')
    return transcript


@app_routes.route("/transcription/<task_id>", methods=["GET"])
def transcription_status(task_id: str):
    task = transcribe.AsyncResult(task_id)
    if task.ready():
        transcript_data = task.result
        transcript_text = transcript_data["text"]
        return make_response(transcript_text, type='transcription')
    else:
        return make_response("Transcribing...", status=202, type='wait')