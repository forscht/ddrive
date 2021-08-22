// eslint-disable-next-line max-classes-per-file
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const DiscordAPI = require('./discordAPI')

const ENTRY_TYPE = {
    FILE: 0,
    DIRECTORY: 1,
}

class BaseEntry {
    constructor() {
        this.name = undefined
        this.mid = undefined
        this.changed = undefined
        this.created = undefined
    }
}

class File {
    constructor() {
        this.journalEntry = null
        this.parts = []
    }

    get size() {
        return this.journalEntry.size + this.parts.map((a) => a.size).reduce((a, b) => a + b, 0)
    }
}

class FileEntry extends BaseEntry {
    constructor() {
        super()
        this.type = ENTRY_TYPE.FILE
    }
}

class DirectoryEntry extends BaseEntry {
    constructor() {
        super()
        this.type = ENTRY_TYPE.DIRECTORY
        this.id = undefined
    }
}

class DiscordFS {
    constructor(opts) {
        this.channelId = opts.channelId
        this.token = opts.token
        this.discordAPI = new DiscordAPI(this.token)

        this.files = []
        this.directories = []
    }

    async load() {
        const tempMessageCache = []
        let channelMessages = await this.discordAPI.fetchMessages(this.channelId, { limit: 100 })
        while (channelMessages.length > 0) {
            tempMessageCache.push(...channelMessages)
            // eslint-disable-next-line no-await-in-loop
            channelMessages = await this.discordAPI.fetchMessages(
                this.channelId,
                {
                    limit: 100,
                    before: tempMessageCache[tempMessageCache.length - 1].id,
                },
            )
        }
    }

    normalizePath(p) {
        let r = path.posix.normalize(p.replace(/\\/g, '/'))
        if (r.endsWith('/') && r !== '/') r = r.slice(0, -1)

        return r
    }

    async createFile(filePath, stream) {

    }

    async createFileChunk(filePath, fileBuffer) {
        const directoryName = this.normalizePath(path.dirname(filePath))
        const fileName = path.basename(filePath)
        let directory = this.directories.find((d) => d.name === directoryName)
        if (!directory) directory = await this.createDirectory(directory)
        if (this.files.find((f) => f.directory === directory.id && f.name === fileName)) {
            throw new Error('file already exist')
        }
        const entry = new FileEntry()
        entry.directory = directory.id
        entry.name = fileName
        const content = JSON.stringify(entry)
        const message = await this.discordAPI.sendSingleAttachmentMessage(this.channelId,
            {
                fileName,
                rawBuffer: fileBuffer,
            }, { content })
        const attachment = message.attachments[0]
        entry.size = attachment.size
        entry.url = attachment.url
        entry.mid = message.id
        this.files.push(entry)

        return entry
    }

    async createDirectory(name) {
        const directoryName = this.normalizePath(name)
        const existingDirectory = this.directories.find((d) => d.name === directoryName)
        if (existingDirectory) return existingDirectory
        const entry = new DirectoryEntry()
        entry.id = uuidv4()
        entry.name = directoryName
        const content = JSON.stringify(entry)
        const message = await this.discordAPI.sendMessage(this.channelId, { body: { content } })
        entry.mid = message.id
        this.directories.push(entry)

        return entry
    }
}

module.exports = DiscordFS
