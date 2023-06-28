const { Transform } = require('stream')

class StreamChunker extends Transform {
    constructor(chunkSize) {
        super()
        this.chunkSize = chunkSize
        this.fill = 0
        this.chunks = []
    }

    _transform(chunk, encoding, callback) {
        this.fill += chunk.length
        this.chunks.push(chunk)
        while (this.fill >= this.chunkSize) {
            this.push(Buffer.concat(this.chunks, this.chunkSize))
            const lastChunk = this.chunks[this.chunks.length - 1]
            const residue = this.fill - this.chunkSize
            this.chunks = residue === 0 ? [] : [Buffer.from(lastChunk.slice(lastChunk.length - residue))]
            this.fill = residue
        }

        callback()
    }

    _flush(callback) {
        this.push(Buffer.concat(this.chunks))
        callback()
    }
}

module.exports = StreamChunker
