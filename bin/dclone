#!/usr/bin/env node

/* eslint-disable no-restricted-syntax,no-await-in-loop */

const debug = require('debug')
const yargs = require('yargs/yargs')(process.argv.slice(2))
const path = require('path')
const fs = require('fs')
const DiscordFS = require('../src/discordFS')
const Util = require('../src/utils/util')

debug.enable('*') // Enable logging

// Parse option
// Env vars will be parsed as option
// ie DDRIVE_HTTP_PORT will be parsed as httpPort
const args = yargs
    .env('DCLONE')
    .option('token', {
        alias: 'T',
        describe: 'Discord bot/user token',
        required: true,
        type: 'string',
    })
    .option('channelId', {
        alias: 'C',
        describe: 'Text channel id where data will be stored',
        required: true,
        type: 'string',
    })
    .option('path', {
        alias: 'P',
        describe: 'Path to clone',
        required: true,
        type: 'string',
    })
    .config()
    .argv

// Extract arguments
const { token, channelId, path: dataPath } = args
const appDebug = debug('app')

//
// App entry point
//
const startApp = async () => {
    // Boot discordFS
    const discordFS = new DiscordFS({ token, channelId })
    await discordFS.load() // Build file index

    const files = Util.getAllFiles(dataPath).map((p) => path.relative(process.cwd(), p))

    // console.log(files)
    for (const file of files) {
        try {
            await discordFS.createFile(file, fs.createReadStream(file), true)
        } catch (err) {
            appDebug('==== CREATE FILE ERROR ==== \n', err)
        }
    }
}

// Start app
startApp()
    .then()
    .catch((err) => {
        if (err.message.includes('Unknown Channel')) appDebug(`=== APP CRASHED :: INVALID CHANNEL_ID`)
        else if (err.message.includes('Unauthorized')) appDebug('=== APP CRASHED :: INVALID TOKEN')
        else appDebug('=== APP CRASHED :: UNKNOWN ERROR === \n', err)
    })
