require('dotenv')
const { DFs, API } = require('../src')

const {
    WEBHOOKS, // Required
    DATABASE_URL, // Required
    PORT = 3000, // Optional
    TIMEOUT = 60000, // Optional
    CHUNK_SIZE = 7864320, // 7.5MB
    SECRET, // Optional
    CHUNK_PROCESS_CONCURRENCY = 3, // Upload this many chunks at once into discord
} = process.env

const startApp = async () => {
    if (!WEBHOOKS || !DATABASE_URL) throw new Error('Webhooks or database url missing')
    const dfs = new DFs({
        webhooks: WEBHOOKS.split(','),
        chunkSize: CHUNK_SIZE,
        secret: SECRET,
        chunkProcessConcurrency: CHUNK_PROCESS_CONCURRENCY,
        restOpts: {
            timeout: TIMEOUT,
        },
    })
    const api = API(dfs)

    return api.listen({ host: '0.0.0.0', port: PORT })
}

startApp().then()
