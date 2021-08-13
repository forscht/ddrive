require('dotenv').config()
const debug = require('debug')
const DiscordFS = require('./src/discordFS')
const HTTPServer = require('./src/httpServer')

debug.enable('*')
const options = {
    discordFS: {
        token: process.env.TOKEN,
        channelId: process.env.STORAGE_CHANNEL_ID,
    },
    HTTPServer: {
        serverPort: process.env.SERVER_PORT,
        auth: process.env.SERVER_AUTH,
    },
};

/**
 * App entrypoint
 */
(async () => {
    /**
     * Create DiscordFS
     * @type {DiscordFS}
     */
    const discordFS = new DiscordFS(options.discordFS)
    /**
     * Build file index
     */
    await discordFS.buildIndex()
    /**
     * Create and start Http server
     * @type {HttpServer}
     */
    const httpServer = new HTTPServer(discordFS, options.HTTPServer)
    httpServer.build()
})()
