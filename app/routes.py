from flask import request, Blueprint, Flask, make_response
import os

from . import filesystem

app = Flask(__name__)
app_routes = Blueprint("app_routes", __name__)

filesystem = filesystem.FileSystem(root="root/structured-voice-logging/dev_app_data")

 
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
    app.logger.info("Done.")
     
    response = make_response(destpath)
    return response


