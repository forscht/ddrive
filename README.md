<h1 align="center"> DDRIVE </h1>

[![Lint](https://github.com/forscht/ddrive/actions/workflows/lint.yml/badge.svg)](https://github.com/forscht/ddrive/actions/workflows/lint.yml)
[![Docker image](https://github.com/forscht/ddrive/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/forscht/ddrive/actions/workflows/docker-publish.yml)
[![CodeQL](https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/forscht/ddrive/blob/v2/LICENSE)

##### A lightweight cloud storage system using discord as storage device written in nodejs. Supports unlimited file size and unlimited storage, I've implemented it using node js streams with multi-part up & download.

#### Current development branch `v2`

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
npm install -g ddrive
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
