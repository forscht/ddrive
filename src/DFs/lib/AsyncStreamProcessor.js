const { Transform } = require('stream')

class AsyncStreamProcessor extends Transform {
    constructor(chunkProcessor, maxConcurrency) {
        super()
        this.chunkProcessor = chunkProcessor
        this.maxConcurrency = maxConcurrency || 3
        this.currConcurrency = 1
        this.chunkCount = 0
    }

    _transform(chunk, encoding, callback) {
        let callBackCalled = false
        if (this.currConcurrency < this.maxConcurrency) {
            callback(null)
            this.currConcurrency += 1
            callBackCalled = true
        }
        this.chunkProcessor(chunk, this.chunkCount)
            .then(() => {
                if (!callBackCalled) callback(null)
            })
            .catch((err) => callback(err))
        this.chunkCount += 1
    }
}

module.exports = AsyncStreamProcessor
