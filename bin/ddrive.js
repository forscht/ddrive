const config = require('./config')()
const { DFs, API } = require('../src')

const startApp = async () => {
    const { DFsConfig, httpConfig } = config
    // Create DFs Instance
    const dfs = new DFs(DFsConfig)
    // Create API Instance
    const api = API(dfs, httpConfig)

    return api.listen({ host: '0.0.0.0', port: httpConfig.port })
}

startApp().then()
