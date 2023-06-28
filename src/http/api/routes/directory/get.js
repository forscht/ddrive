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
            properties: {
                directoryId: { type: 'string' },
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
    // Get Directory from db
    const directory = await db.getDirectory(directoryId, true)
    if (!directory) throwHttpError('Directory not found for givenId', HTTP_CODE.NOT_FOUND)
    // Transform response from db
    directory.child = directory.child || [] // Handle chunk = null from db
    const resp = {
        ...directory,
        child: {
            directories: directory.child.filter((c) => c.type === 'directory'),
            files: directory.child.filter((c) => c.type === 'file'),
        },
    }
    reply.send(resp)
}
