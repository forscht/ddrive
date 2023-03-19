const getFile = require('./get')
const updateFile = require('./update')
const createFile = require('./create')
const deleteFile = require('./delete')
const downloadFile = require('./download')

module.exports = async function routes(fastify) {
    // Add auth handler
    fastify.addHook('preHandler', fastify.auth([fastify.basicAuth]))
    // Register route
    fastify.get('/files/:fileId', getFile.opts, getFile.handler)
    fastify.get('/files/:fileId/download', downloadFile.opts, downloadFile.handler)
    fastify.post('/files/:directoryId', createFile.opts, createFile.handler)
    fastify.put('/files/:fileId', updateFile.opts, updateFile.handler)
    fastify.delete('/files/:fileId', deleteFile.opts, deleteFile.handler)
}
