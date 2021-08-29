const debug = require('debug')('http')
const http = require('http')
const path = require('path')
const Util = require('./utils/util')

class HttpServer {
    constructor(discordFS, opts = {}) {
        if (!opts.httpPort) debug('WARNING :: HTTP port not defined using default port :', 8080)
        this.httpPort = opts.httpPort || 8080
        if (!opts.auth) debug('WARNING :: Auth not defined starting server without auth')
        this.auth = opts.auth
        this.discordFS = discordFS
    }

    /**
     * Build and start HTTP server
     */
    build() {
        this.server = http.createServer(this.requestHandler.bind(this))
        this.server.listen(this.httpPort, () => {
            debug('http server listening on => ', this.httpPort)
            if (this.auth) debug('auth :: ', this.auth)
        })
    }

    /**
     * HTTP server request router
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async requestHandler(req, res) {
        /**
         * Log request
         */
        debug(`${req.method}${req.url}`)
        /**
         * Authorize request
         */
        if (this.auth && !this.authHandler(req)) {
            res.setHeader('WWW-Authenticate', 'Basic realm="DDrive Access", charset="UTF-8"')
            res.statusCode = 401
            res.end('Unauthorized access')

            return
        }

        try {
            if (req.url === '/favicon.ico') {
                res.writeHead(200)
                res.end(this.favicon)
            } else if (req.method === 'OPTIONS') {
                res.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS, DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition',
                    'Access-Control-Max-Age': 86400,
                    'Content-Length': 0,
                })
                res.end()
            } else if (req.method === 'DELETE') {
                await this.deleteFileHandler(req, res)
            } else if (req.method === 'POST') {
                await this.uploadFileHandler(req, res)
            } else if (req.method === 'GET' && req.url !== '/') {
                await this.downloadFileHandler(req, res)
            } else if (req.method === 'GET') {
                await this.homepageHandler(req, res)
            } else {
                res.writeHead(404)
                res.end('not found')
            }
        } catch (err) {
            Util.errorPrint(err, { method: req.method, url: req.url })
            if (err.code) {
                res.writeHead(409)
                res.end(err.message)
            } else {
                res.writeHead(500)
                res.end('Internal server error')
            }
        }
    }

    /**
     * Authorization handler
     * @param req
     * @return {boolean}
     */
    authHandler(req) {
        if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
            return false
        }
        const [USERNAME, PASSWORD] = this.auth.split(':')
        const base64Credentials = req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [username, password] = credentials.split(':')

        return !(username !== USERNAME || password !== PASSWORD)
    }

    /**
     * Delete file handler
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async deleteFileHandler(req, res) {
        const fileName = path.basename(req.url)
        if (this.discordFS.filesIndex[fileName]) {
            await this.discordFS.deleteFile(fileName)
            res.writeHead(200)
            res.end()
        } else {
            res.writeHead(404)
            res.end('404 not found')
        }
    }

    /**
     * Upload file handler
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async uploadFileHandler(req, res) {
        const filename = path.basename(req.url)
        await this.discordFS.addFile(req, filename)
        res.writeHead(303, { Connection: 'close', Location: '/' })
        res.end()
    }

    /**
     * Download file handler
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async downloadFileHandler(req, res) {
        const fileName = path.basename(req.url)
        if (this.discordFS.filesIndex[fileName]) {
            res.status = 200
            res.writeHead(200, { 'Content-Length': this.discordFS.getFileSize(fileName) })
            await this.discordFS.fetchFile(res, fileName)
        } else {
            res.status = 404
            res.end('404 not found')
        }
    }
}

module.exports = HttpServer
