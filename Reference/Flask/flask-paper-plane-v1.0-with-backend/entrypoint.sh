#!/bin/bash -e

rm -rf /challenges/$USER_PATH/pythonapp/
mkdir -p /challenges/$USER_PATH/flaskapp/
mv /usr/src/app/ /challenges/$USER_PATH/flaskapp/

cd /challenges/$USER_PATH/flaskapp/ && ls && nodemon --legacy-watch --exec "python3" app/app.py runserver 0.0.0.0:8000