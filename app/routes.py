from flask import request, Blueprint, Flask, make_response, jsonify

import os
from typing import Dict

from . import filesystem, transcription
from .svl import LogFilesFinder

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)


HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"
LOGFILES_DIR = f"{APPDATA_PATH}/logfiles"

filesystem = filesystem.FileSystem(root=APPDATA_PATH)
transcriber = transcription.DeepgramTranscriber()

@app_routes.route("/upload", methods=["POST"])
def upload():
    # saves an audio file to the filesystem, returns the transcription ID
    print("Entering routes.upload...")
    
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
    
    app.logger.info("Transcribing...")
    transcript = transcriber.transcribe(destpath)
    app.logger.info("Done transcribing.")
    response_data = {'transcription': transcript}
    return make_response(jsonify(response_data))


# @app_routes.route("/kickoff", methods=["POST"])
# def kickoff():
#     print(request)
#     print(request.get_json())
#     audio_url = request.get_json()['audio_url']
#     return make_response(jsonify(transcription.kickoff(audio_url)))
    


# # an endpoint that takes a transcript and returns a list of topics
# @app_routes.route("/topics", methods=["POST"])
# def topics():
#     transcript = request.get_json()
#     text = transcript['text']
#     file_finder = LogFilesFinder(text, LOGFILES_DIR)
#     topics = {'topics': file_finder.relevant_files}
#     return make_response(topics)


# def transcribe(audio_file: str) -> Dict:
#     transcriber = transcription.Transcriber(audio_dir=f"{filesystem.root}/recordings")
#     transcript = transcriber.transcribe(audio_file)
#     app.logger.info(f'transcript: "{transcript}"')
#     return transcript
