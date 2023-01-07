const { Transform } = require('stream')

class AsyncStreamProcessor extends Transform {
    constructor(chunkProcessor) {
        super()
        this.chunkProcessor = chunkProcessor
    }

    _transform(chunk, encoding, callback) {
        this.chunkProcessor(chunk)
            .then(() => callback(null))
            .catch((err) => callback(err))
    }
}

module.exports = AsyncStreamProcessor
