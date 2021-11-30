/* eslint-disable no-await-in-loop,no-restricted-syntax */
const { v4: uuidv4 } = require('uuid')
const debug = require('debug')('discordFS')
const https = require('https')
const AsyncStreamProcessor = require('../utils/asyncStreamProcessor')

class File {
    constructor(opts) {
        this.name = opts.name
        this.parts = []
        this.directoryId = opts.directoryId
        this.createdAt = opts.createdAt
        this.id = opts.id || uuidv4()
    }

    get size() {
        return this.parts.map((p) => p.size)
            .reduce((t, s) => t + s, 0)
    }

    get urls() {
        return this.parts.sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => p.url)
    }

    get messageIds() {
        return this.parts.map((p) => p.mid)
    }

    async download(stream) {
        debug('>> [DOWNLOAD] in progress :', this.name)
        for (const file of this.urls) {
            await new Promise((resolve, reject) => {
                https.get(file, (res) => {
                    res.pipe(new AsyncStreamProcessor(async (data) => {
                        if (!stream.write(data)) await new Promise((r) => stream.once('drain', r))
                    }))
                    res.on('error', (err) => reject(err))
                    res.on('end', () => resolve())
                })
            })
        }
        debug('>> [DOWNLOAD] completed   :', this.name)
        stream.end()
    }
}

module.exports = File
