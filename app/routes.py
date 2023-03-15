from flask import request, Blueprint, Flask, make_response, jsonify

import os
import json
import openai

from typing import Any

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)
app.register_blueprint(app_routes)


HOMEDIR = os.path.expanduser("~")
APPDATA_PATH = f"{HOMEDIR}/structured-voice-logging/dev_app_data"
LOGFILES_DIR = f"{APPDATA_PATH}/logfiles"



def _get_write_type(content: Any):
    if isinstance(content, str):
        return 'w'
    elif isinstance(content, bytes):
        return 'wb'
    else:
        raise TypeError(f"content must be str or bytes, not {type(content)}")
        
        
class FileSystem:
    def __init__(self, root: str) -> None:
        self.root = root
    
    def save(self, path: str, content: str) -> None:
        with open(os.path.join(self.root, path), _get_write_type(content)) as f:
            f.write(content)


class WhisperTranscriber:
    async def transcribe(self, file):
        with open(file, 'rb') as audio:
            transcript = openai.Audio.transcribe(
                "whisper-1", audio,
                prompt="The audio might be all silence. If you don't hear anything, don't output anything!")
        print(json.dumps(transcript, indent=4))
        return transcript

    

filesystem = FileSystem(root=APPDATA_PATH)
transcriber = WhisperTranscriber()

@app_routes.route("/transcribe", methods=["POST"])
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
