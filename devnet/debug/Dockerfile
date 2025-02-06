FROM alpine:latest

RUN apk update
RUN apk add bash curl jq rsync nodejs neovim

WORKDIR /debug

COPY functions.sh .

ENTRYPOINT ["/bin/bash"]

