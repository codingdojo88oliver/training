#!/bin/bash -e

rm -rf /challenges/$USER_PATH/pythonapp/
mkdir -p /challenges/$USER_PATH/pythonapp/
mv /pythonapp/ /challenges/$USER_PATH/

#echo -e "\n\nDATABASES = {\r\n    'default': {\r\n        'ENGINE': 'mysql.connector.django', \r\n        'NAME': '"$DC_DB_NAME"',\r\n        'USER': '"$DC_DB_USERNAME"',\r\n        'PASSWORD': '"$DC_DB_PASSWORD"',\r\n        'HOST': '"$DC_DB_HOST"',\r\n   'PORT': '3306',\r\n    }\r\n}" >>  main/main/settings.py && 
cd /challenges/$USER_PATH/pythonapp/main && python3 manage.py makemigrations && python3 manage.py migrate 
cd /challenges/$USER_PATH/pythonapp/ && nodemon --legacy-watch --exec "python3" -u main/manage.py runserver 0.0.0.0:8000

