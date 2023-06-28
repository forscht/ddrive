class Util {
    /**
     * Parse "Range" header `str` relative to the given file `size`.
     *
     * @param {Number} size
     * @param {String} str
     * @return {Object|Number}
     */
    static rangeParser(size, str) {
        if (typeof str !== 'string') return -1

        const index = str.indexOf('=')

        if (index === -1) return -1

        // split the range string
        const [rangeStr] = str.slice(index + 1).split(',')

        const range = rangeStr.split('-')
        let start = parseInt(range[0], 10)
        let end = parseInt(range[1], 10)

        // -nnn
        if (Number.isNaN(start)) {
            start = size - end
            end = size - 1
            // nnn-
        } else if (Number.isNaN(end)) {
            end = size - 1
        }

        // limit last-byte-pos to current length
        if (end > size - 1) {
            end = size - 1
        }

        // invalid or unsatisfiable
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0) {
            return -1
        }

        // add range
        return { start, end }
    }

    /**
     * Throw http error code with status code
     * @param message
     * @param [statusCode=500]
     */
    static throwHttpError(message, statusCode = 500) {
        const error = new Error(message)
        error.statusCode = statusCode
        throw error
    }
}
module.exports = Util
