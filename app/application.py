from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    CORS(app)
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(port=5555, debug=True)