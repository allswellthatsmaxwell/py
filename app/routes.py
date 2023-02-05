from flask import request, Blueprint, Flask, make_response
import os

import filesystem

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)

filesystem = filesystem.FileSystem("/mnt/c/Users/allsw/projects/structured-voice-logging/dev_app_data")

 
@app_routes.route("/upload", methods=["POST"])
def recording():
    # saves an audio file to the filesystem, returns the filename
    audio_data = request.data
    
    app.logger.info(audio_data)
    
    dest_dir = os.path.join(filesystem.root, "recordings")
    os.makedirs(dest_dir, exist_ok=True)
    
    destpath = f"{dest_dir}/rec1.mp4"
    filesystem.save(destpath, audio_data)
    # transcription = svl.Transcriber()
    response = make_response(destpath)
    response.headers['Permissions-Policy'] = 'microphone=(self)'
    return response