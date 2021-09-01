const EntryType = require('./entryType')
const BaseEntry = require('./baseEntry')

class FileEntry extends BaseEntry {
    constructor(opts) {
        super(opts)
        this.type = EntryType.FILE
        this.partNumber = opts.partNumber
        this.directoryId = opts.directoryId
        this.fileId = opts.fileId
        this.size = opts.size
        this.url = opts.url
    }
}

module.exports = FileEntry
