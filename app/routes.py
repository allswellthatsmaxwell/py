from flask import request, Blueprint, make_response, jsonify

import os
from . import filesystem, transcription

app_routes = Blueprint("app_routes", __name__)

HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"
LOGFILES_DIR = f"{APPDATA_PATH}/logfiles"

filesystem = filesystem.FileSystem(root=APPDATA_PATH)
transcriber = transcription.WhisperTranscriber()

@app_routes.route("/transcribe", methods=["POST"])
async def transcribe():
    print("Entering routes.transcribe...")
    
    audio_data = request.get_data()

    print("/transcribe: len(audio_data):", len(audio_data))
    
    dest_dir = os.path.join(filesystem.root, "recordings")
    os.makedirs(dest_dir, exist_ok=True)
    
    destpath = f"{dest_dir}/rec1.wav"
    app_routes.logger.info(f"Writing to '{destpath}'.")
    with open(destpath, "wb") as f:
        f.write(audio_data)
    app_routes.logger.info("Done writing.")
    
    app_routes.logger.info("Transcribing...")
    transcript = await transcriber.transcribe(destpath)
    app_routes.logger.info("Done transcribing.")
    print(transcript)
    response_data = {'transcription': transcript}
    return make_response(jsonify(response_data))


