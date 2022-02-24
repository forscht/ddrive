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

    get chunkSize() {
        return this.parts[0].size
    }

    get sortedParts() {
        return this.parts.sort((a, b) => a.partNumber - b.partNumber)
    }

    get messageIds() {
        return this.parts.map((p) => p.mid)
    }

    rangedParts(start, end) {
        const startPartNumber = Math.ceil(start / this.chunkSize) ? Math.ceil(start / this.chunkSize) - 1 : 0
        const endPartNumber = Math.ceil(end / this.chunkSize)
        const partsToDownload = this.parts.slice(startPartNumber, endPartNumber)
        partsToDownload[0].start = start % this.chunkSize
        partsToDownload[partsToDownload.length - 1].end = end % this.chunkSize

        return partsToDownload
    }

    async download(stream, start, end) {
        debug('>> [DOWNLOAD] in progress :', this.name)
        let partsToDownload = this.sortedParts
        if (start || end) partsToDownload = this.rangedParts(start, end)
        for (const part of partsToDownload) {
            let headers = {}
            if (part.start || part.end) headers = { Range: `bytes=${part.start || 0}-${part.end || ''}` }
            await new Promise((resolve, reject) => {
                https.get(part.url, { headers }, (res) => {
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
