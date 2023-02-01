from flask import Flask, request, Blueprint


app_routes = Blueprint("app_routes", __name__)

@app_routes.route("/recording", methods=["POST"])
def recording():
    audio_data = request.data
    # Do something with the audio data here
    return "Received audio data"
