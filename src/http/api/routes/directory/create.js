const HTTP_CODE = require('../../constants/httpCode')
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
        },
    },
}

module.exports.handler = async (req, reply) => {
    const directory = await db.createDirectoryOrFile(req.body)
    reply.send(directory)
}
