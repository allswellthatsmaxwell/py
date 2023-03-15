from flask import request, Blueprint, Flask, make_response, jsonify

import os
import asyncio
from . import filesystem, transcription

from application import create_app
app = create_app()


HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"
LOGFILES_DIR = f"{APPDATA_PATH}/logfiles"

filesystem = filesystem.FileSystem(root=APPDATA_PATH)
transcriber = transcription.WhisperTranscriber()

@app.route("/transcribe", methods=["POST"])
async def transcribe():
    print("Entering routes.transcribe...")
    
    audio_data = request.get_data()

    print("/transcribe: len(audio_data):", len(audio_data))
    
    dest_dir = os.path.join(filesystem.root, "recordings")
    os.makedirs(dest_dir, exist_ok=True)
    
    destpath = f"{dest_dir}/rec1.wav"
    app.logger.info(f"Writing to '{destpath}'.")
    with open(destpath, "wb") as f:
        f.write(audio_data)
    app.logger.info("Done writing.")
    
    app.logger.info("Transcribing...")
    transcript = await transcriber.transcribe(destpath)
    app.logger.info("Done transcribing.")
    print(transcript)
    response_data = {'transcription': transcript}
    return make_response(jsonify(response_data))


