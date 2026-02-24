FROM python:3.11.5

RUN apt-get -y update && apt-get -y install build-essential \
    libpq-dev libssl-dev

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=120

RUN mkdir /ragmeup
RUN mkdir /data
WORKDIR /ragmeup

COPY requirements.txt requirements.txt
RUN pip3 install --upgrade pip setuptools wheel
RUN for i in 1 2 3; do pip3 install --no-cache-dir -r requirements.txt && break || (echo "pip install failed, retrying..." && sleep 5); done
RUN pip3 install --no-cache-dir gunicorn

EXPOSE 5000

COPY . .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

ARG UNAME=interfaceuser
ARG UID=101
ARG GID=101

RUN groupadd -g $GID -o $UNAME
RUN useradd -m -u $UID -g $GID -o -s /bin/bash $UNAME

RUN chown -R $UID:$GID /ragmeup
RUN chown -R $UID:$GID /data

USER $UNAME

ENTRYPOINT ["docker-entrypoint.sh"]
