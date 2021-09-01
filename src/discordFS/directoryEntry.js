const { v4: uuidv4 } = require('uuid')
const EntryType = require('./entryType')
const BaseEntry = require('./baseEntry')

class DirectoryEntry extends BaseEntry {
    constructor(opts) {
        super(opts)
        this.type = EntryType.DIRECTORY
        this.createdAt = opts.createdAt
        this.id = opts.id || uuidv4()
    }
}

module.exports = DirectoryEntry
