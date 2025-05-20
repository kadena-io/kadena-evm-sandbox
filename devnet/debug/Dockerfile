FROM alpine:latest

RUN apk update
RUN apk add bash curl jq rsync nodejs neovim python3 py3-pip

WORKDIR /debug

COPY functions.sh cuts.py .

RUN python3 -m venv .venv
RUN source .venv/bin/activate \
    && pip3 install pyaml aiohttp frozenlist

ENTRYPOINT ["/bin/bash"]

