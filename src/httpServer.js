const debug = require('debug')('http')
const http = require('http')
const fs = require('fs')
const path = require('path')
const Util = require('./utils/util')

/**
 * HTTP Server - API for discordFS
 * === API ENDPOINT ===
 * GET - /Directory - Return HTML
 * GET - /Directory/file.mp4 - Return file from discordFS
 * PUT - /Directory1 - Create directory in discordFS
 * POST - /Directory1/file1.mp4 - Create file in discordFS
 * DELETE - /Directory1/file1.mp4 - Delete file
 * DELETE - /Directory1 - Delete directory
 * === RESERVED PATH ===
 * - /favicon.ico
 * - /style.css
 */
class HttpServer {
    /**
     * @description Create HTTP frontend for discordFS
     * @param discordFS
     * @param {Object} opts
     * @param {Number} [opts.httpPort=8080] - Port where HTTP server will start listening
     * @param {String} [opts.auth] - Basic auth support for HTTP server. Format : username:password
     */
    constructor(discordFS, opts = {}) {
        if (!opts.httpPort) debug('WARNING :: HTTP port not defined using default port or Heroku Port:', 8080)
        this.httpPort = opts.httpPort || process.env.PORT || 8080 // To support Heroku
        if (!opts.auth) debug('WARNING :: Auth not defined starting server without auth')
        this.auth = opts.auth
        this.discordFS = discordFS
        this.loadStaticFiles()
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
     * Load static HTML files
     */
    loadStaticFiles() {
        this.webPage = fs.readFileSync(`${__dirname}/../html/index.html`)
            .toString()
        this.favicon = fs.readFileSync(`${__dirname}/../html/favicon.ico`)
        this.styleCSS = fs.readFileSync(`${__dirname}/../html/style.css`)
            .toString()
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

        const decodedURL = decodeURI(req.url)

        try {
            if (req.url === '/favicon.ico') {
                res.writeHead(200)
                res.end(this.favicon)
            } else if (req.url === '/style.css') {
                res.writeHead(200)
                res.end(this.styleCSS)
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
                await this.deleteResourceHandler(req, res)
            } else if (req.method === 'PURGE') {
                await this.discordFS.rmdir(req.url)
                res.writeHead(200)
                res.end()
            } else if (req.method === 'POST') {
                await this.discordFS.createFile(decodedURL, req)
                res.writeHead(303, {
                    Connection: 'close',
                    Location: '/',
                })
                res.end()
            } else if (req.method === 'PUT') {
                await this.discordFS.mkdir(decodedURL)
                res.writeHead(303, {
                    Connection: 'close',
                    Location: '/',
                })
                res.end()
            } else if (req.method === 'GET' && decodedURL.startsWith('/find/')) {
                const entries = this.discordFS.find(path.basename(decodedURL))
                const webpage = this.renderWeb(entries, `/${path.basename(decodedURL)}`, true)
                res.writeHead(200)
                res.end(webpage)
            } else if (req.method === 'GET') {
                const file = this.discordFS.getFile(decodedURL)
                const directory = this.discordFS.getDirectory(decodedURL)
                if (file) {
                    const { range } = req.headers
                    const parsedRange = Util.rangeParser(file.size, range, { chunkSize: 40 ** 6 })
                    if (range && parsedRange !== -1) {
                        const { start, end } = parsedRange
                        res.writeHead(206, {
                            'Content-Length': end - start + 1,
                            'Content-Range': `bytes ${start}-${end}/${file.size}`,
                            'Accept-Ranges': 'bytes',
                        })
                        await file.download(res, start, end)
                    } else {
                        res.writeHead(200, {
                            'Content-Length': file.size,
                            'Accept-Ranges': 'bytes',
                        })
                        await file.download(res)
                    }
                } else if (directory) {
                    const entries = this.discordFS.list(decodedURL)
                    const webpage = this.renderWeb(entries, decodedURL)
                    res.writeHead(200)
                    res.end(webpage)
                } else if (req.url === '/') {
                    const webpage = this.renderWeb([], decodedURL)
                    res.writeHead(200)
                    res.end(webpage)
                } else {
                    res.writeHead(404)
                    res.end('not found')
                }
            } else {
                res.writeHead(404)
                res.end('not found')
            }
        } catch (err) {
            Util.errorPrint(err, {
                method: req.method,
                url: decodedURL,
            })
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
        const credentials = Buffer.from(base64Credentials, 'base64')
            .toString('ascii')
        const [username, password] = credentials.split(':')

        return !(username !== USERNAME || password !== PASSWORD)
    }

    /**
     * Delete file handler
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async deleteResourceHandler(req, res) {
        const decodedURL = decodeURI(req.url)
        const file = this.discordFS.getFile(decodedURL)
        if (file) {
            await this.discordFS.rm(file)
            res.writeHead(200)
            res.end()
        } else {
            await this.discordFS.rmdir(decodedURL)
            res.writeHead(200)
            res.end()
        }
    }

    /**
     * Render webpage
     * @param {Object[]} entries
     * @param {String} reqPath
     * @param {Boolean} find
     * @return {string}
     */
    renderWeb(entries, reqPath, find = false) {
        const directoryEntries = Util.sortArrayByKey(entries.filter((entry) => entry.directory === true), 'name')
        const fileEntries = Util.sortArrayByKey(entries.filter((entry) => entry.directory === false), 'name')
        const directoryHTML = directoryEntries.map((entry) => `<div class="folder-entry entry">
            <div class="svg-image">
                <i>
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 22 22"
                         style="fill: #9399a2;">
                        <path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z"></path>
                    </svg>
                </i>
            </div>
            <a href="${find ? entry.name : path.join(reqPath, entry.name)}" class="name-of-folder">${find ? path.basename(entry.name) : entry.name}</a>
            <button class="delete-file" id="${find ? entry.name : path.join(reqPath, entry.name)}">Delete</button>
        </div>`)
            .join('\n')

        const filesHTML = fileEntries.map((entry) => `<div class="file-entry entry">
            <div class="svg-image">
                <i>
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 22 22"
                         style="fill: #9399a2;">
                        <path d="M19.937 8.68c-.011-.032-.02-.063-.033-.094a.997.997 0 0 0-.196-.293l-6-6a.997.997 0 0 0-.293-.196c-.03-.014-.062-.022-.094-.033a.991.991 0 0 0-.259-.051C13.04 2.011 13.021 2 13 2H6c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2V9c0-.021-.011-.04-.013-.062a.99.99 0 0 0-.05-.258zM16.586 8H14V5.414L16.586 8zM6 20V4h6v5a1 1 0 0 0 1 1h5l.002 10H6z"></path>
                    </svg>
                </i>
            </div>
            <a href="${path.join(find ? entry.path : reqPath, entry.name)}" class="name-of-file">${entry.name} </a>
            <button class="delete-file" id="${path.join(find ? entry.path : reqPath, entry.name)}">Delete</button>
            <p class="file-size">${Util.humanFileSize(entry.size, true)}</p>
        </div>`)
            .join('\n')

        let directoryArray = Util.explodePath(reqPath)
        if (!directoryArray.length) directoryArray = ['/']
        const pathNavigationHTML = directoryArray.map((directory) => {
            const pathArray = directory.split('/')

            return `<li><a href="${directory}">${pathArray[pathArray.length - 1] || 'HOME'}</a></li>`
        })
        const pathArray = reqPath.split('/')
        pathNavigationHTML[directoryArray.length - 1] = `<li id="current-path">${pathArray[pathArray.length - 1] || 'HOME'}</li>`

        // this.loadStaticFiles() // For testing purpose read load static file on every request

        return this.webPage
            .replace('{{DIRECTORY_ENTRIES}}', directoryHTML)
            .replace('{{FILE_ENTRIES}}', filesHTML)
            .replace('{{PATH_PLACE_HOLDER}}', pathNavigationHTML.join('\n'))
            .replace('{{TOTAL_FS_SIZE}}', Util.humanFileSize(this.discordFS.size, true))
    }
}

module.exports = HttpServer
