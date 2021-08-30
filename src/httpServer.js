const debug = require('debug')('http')
const http = require('http')
const fs = require('fs')
const path = require('path')
const Util = require('./utils/util')

class HttpServer {
    constructor(discordFS, opts = {}) {
        if (!opts.httpPort) debug('WARNING :: HTTP port not defined using default port :', 8080)
        this.httpPort = opts.httpPort || 8080
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
            } else if (req.method === 'PURGE') {
                await this.discordFS.rmdir(req.url)
                res.writeHead(200)
                res.end()
            } else if (req.method === 'POST') {
                await this.discordFS.createFile(req.url, req)
                res.writeHead(303, { Connection: 'close', Location: '/' })
                res.end()
            } else if (req.method === 'PUT') {
                await this.discordFS.mkdir(req.url)
                res.writeHead(303, { Connection: 'close', Location: '/' })
                res.end()
            } else if (req.method === 'GET') {
                const file = this.discordFS.getFile(req.url)
                const directory = this.discordFS.getDirectory(req.url)
                if (file) {
                    res.status = 200
                    res.writeHead(200, {
                        'Content-Length': file.size,
                        'Content-Disposition': `attachment; filename="${file.name}"`,
                    })
                    await file.download(res)
                } else if (directory) {
                    const entries = this.discordFS.list(req.url)
                    const webpage = this.renderWeb(entries, req.url)
                    res.writeHead(200)
                    res.end(webpage)
                } else if (req.url === '/') {
                    const webpage = this.renderWeb([], req.url)
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
                url: req.url,
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
    async deleteFileHandler(req, res) {
        const file = this.discordFS.getFile(req.url)
        if (file) {
            await this.discordFS.rm(file)
            res.writeHead(200)
            res.end()
        } else {
            res.writeHead(404)
            res.end('404 not found')
        }
    }

    renderWeb(entries, reqPath) {
        const directoryEntries = entries.filter((entry) => entry.directory === true)
        const fileEntries = entries.filter((entry) => entry.directory === false)

        const directoryHTML = directoryEntries.map((entry) => `<div class="folder-entry entry">
            <div class="svg-image">
                <i>
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 22 22"
                         style="fill: #9399a2;">
                        <path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z"></path>
                    </svg>
                </i>
            </div>
            <a href="${path.join(reqPath, entry.name)}" class="name-of-folder">${entry.name}</a>
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
            <a href="${path.join(reqPath, entry.name)}" class="name-of-file">${entry.name} </a>
            <button class="delete-file" id="${path.join(reqPath, entry.name)}">Delete</button>
            <p class="file-size">${Util.humanFileSize(entry.size)}</p>
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
        this.loadStaticFiles()

        return this.webPage
            .replace('{{DIRECTORY_ENTRIES}}', directoryHTML)
            .replace('{{FILE_ENTRIES}}', filesHTML)
            .replace('{{PATH_PLACE_HOLDER}}', pathNavigationHTML.join('\n'))
            .replace('{{TOTAL_FS_SIZE}}', Util.humanFileSize(this.discordFS.size))
    }
}

module.exports = HttpServer
