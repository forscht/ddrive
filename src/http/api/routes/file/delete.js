const HTTP_CODE = require('../../constants/httpCode')
const db = require('../../services/database')

module.exports.opts = {
    schema: {
        params: {
            type: 'object',
            required: ['fileId'],
            properties: {
                directoryId: { type: 'string', format: 'uuid' },
            },
        },
        response: {
            [HTTP_CODE.BAD_REQUEST]: { $ref: 'CommonError#' },
            [HTTP_CODE.UNAUTHORIZED]: { $ref: 'CommonError#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    const { fileId } = req.params
    await db.deleteDirectory(fileId, 'file')
    reply.code(HTTP_CODE.NO_CONTENT)
}
