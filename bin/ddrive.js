const config = require('./config')()
const { DFs, HttpServer } = require('../src')

const startApp = async () => {
    const { DFsConfig, httpConfig } = config
    // Create DFs Instance
    const dfs = new DFs(DFsConfig)
    // Create http Server instance
    const httpServer = HttpServer(dfs, httpConfig)

    return httpServer.listen({ host: '0.0.0.0', port: httpConfig.port })
}

startApp().then()
