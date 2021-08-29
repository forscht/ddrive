<h1 align="center"> DDRIVE </h1>

<p align="center"><strong> A lightweight cloud storage system using discord as storage device written in nodejs.</strong></p>
<p align="center">
    <a href="https://github.com/forscht/ddrive/actions/workflows/lint.yml">
        <img src="https://github.com/forscht/ddrive/actions/workflows/lint.yml/badge.svg">
    </a>
    <a href="https://github.com/forscht/ddrive/actions/workflows/docker-publish.yml">
        <img src="https://github.com/forscht/ddrive/actions/workflows/docker-publish.yml/badge.svg">
    </a>
    <a href="https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml">
        <img src="https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml/badge.svg">
    </a>
    <a href="https://github.com/forscht/ddrive/issues">
        <img src="https://img.shields.io/github/issues/forscht/ddrive.svg">
    </a>
    <a href="https://github.com/forscht/ddrive/blob/v2/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
    </a>
</p>
<br>

##### **DDrive** Supports unlimited file size and unlimited storage, I've implemented it using node js streams with multi-part up & download.

#### Current development branch `2.x`

### Features
- Theoretically unlimited file size thanks to splitting the file in 8mb chunks using nodejs streams API.
- Simple yet robust HTTP front end
- Tested with storing 1TB of data on single discord channel (Few files are over 5 GB).
- Supports basic auth
- Easily deploy on heroku/repl.it and use as private cloud storage.(Use `ddrive v1` on repl, repl doesn't support node version 16 yet)

### Requirement
- NodeJS v16.x (Not required for docker option)
- Bot Token, Channel id

### Installation
#### Using NPM
```shell
npm install -g @forscht/ddrive
ddrive --token <bot token> --channelId <guild channel id>
# Open http://localhost:8080 in browser
# use <ddrive help> for more info
```

#### Using docker
```shell
docker run --rm -p 8080:8080 -it forscht/ddrive --port 8080 --token <bot-token> --channelId <guild-channel-id>
# Open http://localhost:8080 in browser
# use <docker run --rm -it forscht/ddrive help> for more info
```
