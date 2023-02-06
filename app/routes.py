from flask import request, Blueprint, Flask, make_response
import os
from typing import Dict

from . import filesystem, transcriber

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)

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
     
    
    app.logger.info("Transcribing.")
    transcript_data = transcribe(destpath)
    app.logger.info("Done transcribing.")
    transcript_text = transcript_data["text"]
    
    return make_response(transcript_text)


def transcribe(audio_file: str) -> Dict:
    ts = transcriber.Transcriber(audio_dir=f"{filesystem.root}/recordings")
    transcript = ts.transcribe(audio_file)
    app.logger.info(f'transcript: "{transcript}"')