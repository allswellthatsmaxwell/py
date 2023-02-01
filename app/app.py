from .routes import app_routes
from flask import Flask

app = Flask(__name__)
app.register_blueprint(app_routes)
