<h1 align="center" style="font-size: 60px"> DDRIVE </h1>

<p align="center"><strong> Turns Discord into a datastore that can manage and store your files. </strong></p>
<p align="center">
    <a href="https://github.com/forscht/ddrive/actions/workflows/lint.yml">
        <img src="https://github.com/forscht/ddrive/actions/workflows/lint.yml/badge.svg">
    </a>
    <a href="https://hub.docker.com/r/forscht/ddrive">
        <img src="https://img.shields.io/docker/v/forscht/ddrive?logo=docker">
    </a>
    <a href="https://hub.docker.com/r/forscht/ddrive">
        <img src="https://img.shields.io/docker/pulls/forscht/ddrive.svg?logo=docker">
    </a>
    <a href="https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml">
        <img src="https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml/badge.svg">
    </a>
    <a href="https://github.com/forscht/ddrive/blob/v2/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
    </a>

</p>
<br>

##### **DDrive** A lightweight cloud storage system using discord as storage device written in nodejs. Supports unlimited file size and unlimited storage, I've implemented it using node js streams with multi-part up & download.

#### Current development branch `3.x`

### Features
- Theoretically unlimited file size thanks to splitting the file in 8mb chunks using nodejs streams API.
- Simple yet robust HTTP front end
- Tested with storing 1 TB of data on single discord channel (Few files are over 5 GB).
- Supports basic auth
- Easily deploy on heroku/repl.it and use as private cloud storage.(Use `ddrive v1` on repl, repl doesn't support node version 16 yet)

### Requirement
- NodeJS v16.x or Docker
- Bot Token, Channel ID

### Usage
```shell
DDRIVE - A lightweight cloud storage system using discord as storage device written in nodejs.
Options:
      --help       Show help                                           [boolean]
      --version    Show version number                                 [boolean]
  -P, --httpPort   Port of HTTP server                                  [number]
  -A, --auth       Username password separated by ":". ie - admin:password
                                                                        [string]
  -T, --token      Discord bot/user token                    [string] [required]
  -C, --channelId  Text channel id where data will be stored [string] [required]
      --config     Path to JSON config file
```
### Installation
#### With NPM
```shell
npm install -g @forscht/ddrive
ddrive --token <bot token> --channelId <guild channel id>
# Open http://localhost:8080 in browser
# use <ddrive help> for more info
```

#### With Docker
```shell
docker run --rm -p 8080:8080 -it forscht/ddrive --port 8080 --token <bot-token> --channelId <guild-channel-id>
# Open http://localhost:8080 in browser
# use <docker run --rm -it forscht/ddrive help> for more info
```

#### With PM2 / Environment variables
```
#Linux / MacOS
DDRIVE_TOKEN=<bot token> DDRIVE_CHANNEL_ID=<channel id> pm2 start ddrive

#Windows CMD
set DDRIVE_TOKEN=<bot token> set DDRIVE_CHANNEL_ID=<channel id> pm2 start ddrive

#Windows powershell
$env:DDRIVE_TOKEN="<bot token>"
$env:DDRIVE_CHANNEL="<channel id>"
pm2 start ddrive
```

#### Fix Windows Powershell issue
```shell
#ERROR 
# ddrive : File C:\Users\<User>\AppData\Roaming\npm\ddrive.ps1 cannot be loaded because running scripts is disabled on this system. For more information
1. Open powershell as Administrator
2. run `set-executionpolicy remotesigned`
```
