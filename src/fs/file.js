/* eslint-disable no-await-in-loop,no-restricted-syntax */
const { v4: uuidv4 } = require('uuid')
const debug = require('debug')('discordFS')
const Util = require('../utils/util')

class File {
    constructor(opts) {
        this.name = opts.name
        this.parts = []
        this.directoryId = opts.directoryId
        this.createdAt = opts.createdAt
        this.id = opts.id || uuidv4()
    }

    get size() {
        return this.parts.map((p) => p.size).reduce((t, s) => t + s, 0)
    }

    get urls() {
        return this.parts.map((p) => p.url).sort((a, b) => a.partNumber - b.partNumber)
    }

    get messageIds() {
        return this.parts.map((p) => p.mid)
    }

    async download(stream) {
        debug('>> [DOWNLOAD] in progress :', this.name)
        for (const file of this.urls) {
            const data = await Util.downloadFile(file)
            if (!stream.write(data)) await new Promise((resolve) => stream.once('drain', resolve))
        }
        debug('>> [DOWNLOAD] completed   :', this.name)
        stream.end()
    }
}

module.exports = File
