#!/bin/bash -e

rm -rf /challenges/$USER_PATH/meanapp/
mkdir -p /challenges/$USER_PATH/meanapp/
mv /usr/src/app/ /challenges/$USER_PATH/meanapp/

ln -s /usr/local/lib/node_modules/ /challenges/$USER_PATH/meanapp/app/node_modules

cd /challenges/$USER_PATH/meanapp/app/migrate && node import.js
cd /challenges/$USER_PATH/meanapp/app/ && nodemon --legacy-watch server.js