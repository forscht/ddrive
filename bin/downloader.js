#!/usr/bin/env node
/* eslint-disable no-restricted-syntax,no-await-in-loop */
const request = require('request-promise-native')
const _ = require('lodash')
const fs = require('fs')
const readline = require('readline')
const cliProgress = require('cli-progress')

const concurrency = parseInt(process.env.C, 10) || 8

const getProgressBar = fileName => new cliProgress.SingleBar({
    format: `Downloading ${fileName} | {bar} {percentage}% || {value}/{total} Parts || ETA: {eta_formatted} / {duration_formatted} `,
}, cliProgress.Presets.shades_classic)

const parseURI = async (url) => {
    const uri = await request.get(url)

    return JSON.parse(Buffer.from(uri, 'base64')
        .toString())
}

const downloader = async () => {
    const data = await new Promise((resolve) => {
        const i = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
        i.question('> Enter file uri : ', async (url) => {
            try {
                const parsedData = await parseURI(url)
                i.close()
                process.stdin.destroy()
                resolve(parsedData)
            } catch (err) {
                console.log('=== could not parse uri')
                process.exit(1)
            }
        })
    })
    const { fileName, files } = data
    const downloadFilePath = `${__dirname}/${fileName}`
    const stream = fs.createWriteStream(downloadFilePath)
    console.log(`=== Downloading file at ${downloadFilePath}`)

    const progressBar = getProgressBar(fileName)
    let progress = 0
    progressBar.start(files.length, 0)

    const chunks = _.chunk(files, concurrency)
    try {
        const downloadChunk = async (file) => {
            const buffer = await request.get(file, { encoding: null })
            progress += 1
            progressBar.update(progress)

            return buffer
        }
        for (const chunk of chunks) {
            // eslint-disable-next-line no-loop-func
            const downloadedChunks = await Promise.all(chunk.map(downloadChunk))
            for (const downloadedChunk of downloadedChunks) {
                stream.write(downloadedChunk)
            }
        }
        stream.end()
        progressBar.stop()
    } catch (err) {
        console.log('=== Oops! download failed try again')
        stream.end()
        progressBar.stop()
        fs.unlinkSync(downloadFilePath)
    }
    process.on('SIGTERM', () => fs.unlinkSync(downloadFilePath))
    process.on('SIGINT', () => fs.unlinkSync(downloadFilePath))
}

downloader().then()
