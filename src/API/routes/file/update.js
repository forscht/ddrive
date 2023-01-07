const HTTP_CODE = require('../../constants/httpCode')
const { throwHttpError } = require('../../utils/Util')
const db = require('../../services/database')

module.exports.opts = {
    schema: {
        params: {
            type: 'object',
            required: ['fileId'],
            properties: {
                fileId: { type: 'string' },
            },
        },
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                parentId: { type: 'string' },
            },
        },
        response: {
            [HTTP_CODE.OK]: { $ref: 'File#' },
            [HTTP_CODE.NOT_FOUND]: { $ref: 'CommonError#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    const { fileId } = req.params
    const file = await db.updateDirectoryOrFile(fileId, req.body)
    if (!file) throwHttpError('File not found for given Id', HTTP_CODE.NOT_FOUND)
    reply.send(await db.getFile(fileId, true))
}
