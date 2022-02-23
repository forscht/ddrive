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
- Tested with storing 2.5 TB of data on single discord channel (With max file size of 16GB).
- Supports basic auth for site.
- Easily deploy on heroku/repl.it and use as private cloud storage.(Use `ddrive v1` on repl, repl doesn't support node version 16 yet)

### Live project implementation
Website with 2500GB+ of movies with slightly code modification at [herbalgaanja.com](https://herbalgaanja.com)

## Setup Guide

### Requirement
- NodeJS v16.x or Docker
- Discord bot token, Text Channel ID

### Setting up discord bot and server
1. **Creating the bot** - In order for this program to work, you're going to need to create a discord bot, so we can connect to the discord API. Go to [this](https://discordapp.com/developers/applications/me) link to create a bot. Make sure to create a user bot, ensure the bot is private and **message content intent** is enabled. [Here's](https://i.imgur.com/5AQZGq9.png) a picture to the configuration. **Keep note of the token and the client ID.**
2. **Setting up server** - The bot will need a place to upload files. Create a new discord server, make sure no one else is on it unless you want them to access your files.
3. **Adding your bot to the server** - To add the bot to the server (assuming your bot isn't public), go to the following link: https://discordapp.com/oauth2/authorize?client_id={CLIENT_ID}&scope=bot&permissions=0 Replace {CLIENT_ID} with the client ID you copied earlier. Then, select the server you just made and authorize. Your server should now show your bot like [this](http://i.imgur.com/NnqQAv7.png).
4. **Copy channelId** - Right click on text channel and click on `Copy Id`. If you don't see this option, goto settings -> Advanced -> Enable developer mode.
5. By now you should have `bot token` and `text channel id`.

### Setting up the program
#### With NPM, Open terminal/cmd and run following commands.
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

#### Command info
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

### API usage
```javascript
process.env.DEBUG = '*'
const { DiscordFS, HttpServer } = require('@forscht/ddrive')

const token = '' // Discord bot token
const channelId = '' // Text channelId
const httpPort = 8080 // Ddrive site port
const auth = '' // Basic auth for ddrive site. Format - username:password

const run = async () => {
    const discordFS = new DiscordFS({ token, channelId })
    await discordFS.load() // Read files from text channel and build metadata. Might take time depending on storage size
    const httpServer = new HttpServer(discordFS, { httpPort, auth })
    await httpServer.build() // Finally, start http server here
}

run().then()
```
