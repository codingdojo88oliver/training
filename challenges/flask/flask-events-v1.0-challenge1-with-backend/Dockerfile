FROM python:3.6.5-slim

RUN apt-get update && apt-get install -y curl \
  && curl -sL https://deb.nodesource.com/setup_9.x | bash - \
  && apt-get install -y nodejs \
  && apt-get install -y sqlite3 libsqlite3-dev \
  && apt-get install -y python3-pymysql \
  && curl -L https://www.npmjs.com/install.sh | sh \
  && npm i -g nodemon 

ADD ./src /usr/src/app

RUN cd /usr/src/app && pip install --trusted-host pypi.python.org -r requirements.txt

RUN mkdir /challenges
RUN chmod -R +x /challenges
VOLUME  /challenges

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x usr/local/bin/entrypoint.sh
RUN ln -s usr/local/bin/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["sh","/entrypoint.sh"]
EXPOSE 8000