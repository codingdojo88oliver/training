FROM python:3.7-slim

RUN groupadd -r village88 && useradd -r -g village88 village88

RUN apt-get update && apt-get install -y curl \
  && curl -sL https://deb.nodesource.com/setup_9.x | bash - \
  && apt-get install -y nodejs \
  && curl -L https://www.npmjs.com/install.sh | sh \
  && npm i -g nodemon

ADD ./src /pythonapp/

RUN cd /pythonapp/ && pip install -r requirements.txt && pip3 install  mysql-connector-python  && pip freeze > requirements.txt

COPY ./database/models.py /pythonapp/main/main/models.py
# COPY ./database/models.py /pythonapp/database/models.py

RUN mkdir /challenges
RUN chmod -R +x /challenges
VOLUME  /challenges

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x usr/local/bin/entrypoint.sh
RUN ln -s usr/local/bin/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 8000

# CMD ["python", "main/manage.py", "runserver", "0.0.0.0:8000"]

