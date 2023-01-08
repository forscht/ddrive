const { throwHttpError } = require('../../utils/Util')
const HTTP_CODE = require('../../constants/httpCode')
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
        response: {
            [HTTP_CODE.OK]: { $ref: 'File#' },
        },
    },
}

module.exports.handler = async (req, reply) => {
    const { directoryId } = req.params
    // Check if directory exist for given directoryId
    const directory = await db.getDirectory(directoryId, false)
    if (!directory) throwHttpError('Invalid directoryId', HTTP_CODE.NOT_FOUND)

    // Check if file exist or not in req
    const data = await req.file({ limits: { files: 1 } })
    const { file: fileStream, filename } = data
    if (!fileStream || !filename) throwHttpError('File is missing in request body', HTTP_CODE.BAD_REQUEST)

    // Upload file to discord in chunks
    const discordFileParts = await req.dfs.write(fileStream)

    // Create File in db
    const fileData = { name: filename, parentId: directoryId, type: 'file' }
    const file = await db.createFileWithParts(fileData, discordFileParts)

    // Response
    reply.send(file)
}
