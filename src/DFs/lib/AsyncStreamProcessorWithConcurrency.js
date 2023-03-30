const { Transform } = require('stream')

function cbNoop(cb) {
    cb()
}

class AsyncStreamProcessorWithConcurrency extends Transform {
    constructor(chunkProcessor, maxConcurrency = 1) {
        super()
        this.chunkProcessor = chunkProcessor
        this.maxConcurrency = maxConcurrency
        this.chunkCount = 0

        this.lastCallback = undefined
        this.pendingFinish = undefined
        this.concurrent = 0
        this._final = this.callOnFinish(cbNoop)
    }

    callOnFinish(original) {
        return function cbHell(callback) {
            if (this.concurrent === 0) original.call(this, callback)
            else this.pendingFinish = original.bind(this, callback)
        }
    }

    _transform(chunk, encoding, callback) {
        this.concurrent += 1
        if (this.concurrent < this.maxConcurrency) {
            callback(null)
        } else this.lastCallback = callback
        this.chunkProcessor(chunk, this.chunkCount)
            .then(() => {
                this.concurrent -= 1
                if (this.lastCallback) {
                    this.lastCallback()
                    this.lastCallback = null
                }
                if (this.concurrent === 0 && this.pendingFinish) {
                    this.pendingFinish()
                    this.pendingFinish = null
                }
            })
            .catch((err) => this.emit('error', err))
        this.chunkCount += 1
    }
}

module.exports = AsyncStreamProcessorWithConcurrency
