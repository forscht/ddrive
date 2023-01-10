const HTTP_CODE = require('../../constants/httpCode')
const { throwHttpError } = require('../../utils/Util')
const db = require('../../services/database')

module.exports.opts = {
    schema: {
        params: {
            type: 'object',
            required: ['directoryId'],
            properties: {
                directoryId: { type: 'string' },
            },
        },
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                parentId: { type: 'number' },
            },
        },
        response: {
            [HTTP_CODE.OK]: { $ref: 'Directory#' },
            [HTTP_CODE.NOT_FOUND]: { $ref: 'CommonError#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    const { directoryId } = req.params
    const directory = await db.updateDirectoryOrFile(directoryId, req.body)
    if (!directory) throwHttpError('Directory not found for given Id', HTTP_CODE.NOT_FOUND)
    reply.send(directory)
}
