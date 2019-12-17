FROM node:8-alpine

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories
RUN apk update && apk add bash

ADD ./src /usr/src/app

COPY ./src/package.json /usr/src/app/

RUN npm install -g nodemon mysql express body-parser connect-flash ejs cookie-parser express-session mysql-import moment
RUN mkdir /usr/src/app/migrate
COPY ./database/db.js /usr/src/app/db.js
COPY ./database/import.js /usr/src/app/migrate/import.js
COPY ./database/dctaxi.sql /usr/src/app/migrate/dctaxi.sql


COPY ./src  /usr/src/app/

RUN mkdir /challenges
RUN chmod -R +x /challenges
VOLUME  /challenges

COPY ./entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN ln -s /usr/local/bin/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["sh","/entrypoint.sh"]
EXPOSE 8000