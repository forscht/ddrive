const HTTP_CODE = require('../../constants/httpCode')
const { throwHttpError } = require('../../utils/Util')
const db = require('../../services/database')

module.exports.opts = {
    schema: {
        body: {
            type: 'object',
            required: ['name', 'parentId'],
            properties: {
                name: { type: 'string' },
                parentId: { type: 'string' },
            },
        },
        response: {
            [HTTP_CODE.OK]: { $ref: 'Directory#' },
            [HTTP_CODE.BAD_REQUEST]: { $ref: 'CommonError#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    if (req.body.name != "") {
        const directory = await db.createDirectoryOrFile(req.body)
        reply.send(directory)
    } else {
        throwHttpError('Directory name is empty', HTTP_CODE.BAD_REQUEST)
    }
}
