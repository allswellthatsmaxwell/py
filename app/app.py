from .routes import app_routes
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
app.register_blueprint(app_routes)
CORS(app)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5555)