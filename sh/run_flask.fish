set -xg FLASK_APP app 
set -xg FLASK_ENV development 
flask run -h 0.0.0.0 -p 5555
