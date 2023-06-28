const { throwHttpError } = require('../../utils/Util')
const HTTP_CODE = require('../../constants/httpCode')
const db = require('../../services/database')

module.exports.opts = {
    config: {
        ACCESS_TAGS: ['READ_ONLY_PANEL'],
    },
    schema: {
        params: {
            type: 'object',
            required: ['fileId'],
            properties: {
                fileId: { type: 'string' },
            },
        },
        response: {
            [HTTP_CODE.OK]: { $ref: 'File#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    const { fileId } = req.params
    const file = await db.getFile(fileId, true)
    if (!file) throwHttpError('File not found for given fileId', HTTP_CODE.NOT_FOUND)
    reply.send(file)
}
