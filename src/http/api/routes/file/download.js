const path = require('path')
const mime = require('mime-types')
const { throwHttpError, rangeParser } = require('../../utils/Util')
const HTTP_CODE = require('../../constants/httpCode')
const db = require('../../services/database')

module.exports.opts = {
    config: {
        ACCESS_TAGS: ['READ_ONLY_PANEL', 'READ_ONLY_FILE'],
    },
    schema: {
        params: {
            type: 'object',
            required: ['fileId'],
            properties: {
                fileId: { type: 'string' },
            },
        },
    },
}

//
// Returns number of elements based on start and end
//
const rangedParts = (parts, start, end) => {
    const chunkSize = parts[0].size
    const startPartNumber = Math.ceil(start / chunkSize) ? Math.ceil(start / chunkSize) - 1 : 0
    const endPartNumber = Math.ceil(end / chunkSize)
    const partsToDownload = parts.slice(startPartNumber, endPartNumber)
    partsToDownload[0].start = start % chunkSize
    partsToDownload[partsToDownload.length - 1].end = end % chunkSize

    return partsToDownload
}

module.exports.handler = async (req, reply) => {
    const { fileId } = req.params
    const { range } = req.headers
    //
    // Check in db if file exist for given fileId
    //
    const file = await db.getFile(fileId, true, true)
    if (!file) throwHttpError('File not found for given fileId', HTTP_CODE.NOT_FOUND)
    if (!file.parts.length) throwHttpError('Corrupt file', HTTP_CODE.INTERNAL_SERVER_ERROR)

    //
    // Prepare response headers
    //
    const resHeaders = {
        'Content-Length': file.size,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `attachment; filename="${encodeURI(file.name)}"`,
    }
    const mimeType = mime.lookup(path.extname(file.name))
    if (mimeType) resHeaders['Content-Type'] = mimeType

    //
    // Handle Partial content request (Resume download)
    //
    const parsedRange = rangeParser(file.size, range)
    if (range && parsedRange !== -1) {
        const { start, end } = parsedRange
        reply.raw.writeHead(HTTP_CODE.PARTIAL_CONTENT, {
            ...resHeaders,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${file.size}`,
        })
        file.parts = rangedParts(file.parts, parsedRange.start, parsedRange.end)

        return req.dfs.read(reply.raw, file.parts)
    }
    //
    // Handle request without partial content
    //
    reply.raw.writeHead(HTTP_CODE.OK, resHeaders)

    return req.dfs.read(reply.raw, file.parts)
}
