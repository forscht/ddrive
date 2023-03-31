const { Transform } = require('stream')

/**
 * A function that invokes the given callback with no arguments.
 * @callback cbNoop
 * @param {function} cb - The callback to invoke with no arguments.
 */
function cbNoop(cb) {
    cb()
}

/**
 * A transform stream that applies a given async function to each chunk in parallel
 * up to a maximum concurrency level.
 */
class AsyncStreamProcessor extends Transform {
    /**
     * Create a new instance of the stream processor.
     * @param {function} chunkProcessor - The async function to apply to each chunk.
     * @param {number} [maxConcurrency=1] - The maximum number of concurrent chunk processing operations.
     */
    constructor(chunkProcessor, maxConcurrency = 1) {
        super()
        // Store the chunkProcessor and maxConcurrency values as properties of the class
        this.chunkProcessor = chunkProcessor
        this.maxConcurrency = maxConcurrency

        // Initialize the chunkCount, lastCallback, pendingFinish, and concurrent properties
        this.chunkCount = 0
        this.lastCallback = undefined
        this.pendingFinish = undefined
        this.concurrent = 0
        this._final = this.callOnFinish(cbNoop)
    }

    /**
     * Create a new callback function that wraps the given callback and handles
     * calling it when all pending chunk processing operations have completed.
     * @param {cbNoop} original - The original callback to wrap.
     * @returns {function} - A new callback function that handles calling the original
     * callback when all pending chunk processing operations have completed.
     */
    callOnFinish(original) {
        return function cbHell(callback) {
            if (this.concurrent === 0) {
                original.call(this, callback)
            } else {
                this.pendingFinish = original.bind(this, callback)
            }
        }
    }

    /**
     * Apply the chunk processing function to the given chunk of data.
     * @param {Buffer} chunk - The chunk of data to process.
     * @param {BufferEncoding} encoding - The encoding of the chunk data.
     * @param {function} callback - A callback to invoke when the chunk has been processed.
     */
    _transform(chunk, encoding, callback) {
        // Increment the concurrent counter to track the number of operations currently being performed
        this.concurrent += 1

        // If the number of concurrent operations is less than maxConcurrency, call the callback immediately
        if (this.concurrent < this.maxConcurrency) callback(null)
        // Otherwise, set lastCallback to the provided callback to allow for the next chunk of data to be processed
        else this.lastCallback = callback

        // Call the chunkProcessor function with the current chunk and chunkCount
        this.chunkProcessor(chunk, this.chunkCount)
            .then(() => {
                // Decrement the concurrent counter and check if lastCallback is set
                this.concurrent -= 1

                // If lastCallback is set, call it and reset lastCallback to null
                if (this.lastCallback) {
                    const cb = this.lastCallback
                    this.lastCallback = null
                    cb()
                }
                // Check if there are no more concurrent operations and pendingFinish is set
                if (this.concurrent === 0 && this.pendingFinish) {
                    // If so, call pendingFinish and reset pendingFinish to null
                    this.pendingFinish()
                    this.pendingFinish = null
                }
            }) // If there is an error, emit it as an error event
            .catch((err) => this.emit('error', err))

        // Increment the chunkCount after each call to chunkProcessor
        this.chunkCount += 1
    }
}

module.exports = AsyncStreamProcessor
