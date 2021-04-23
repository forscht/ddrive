const http = require('http')
const path = require('path')
const fs = require('fs')
const { replace } = require('lodash')
const bot = require('./bot')
const uploader = require('./helpers/uploader')
const downloader = require('./helpers/downloader')
const remover = require('./helpers/remover')

const uploadLock = new Set()
const downloadLock = new Set()
const deleteLock = new Set()

let USERNAME
let PASSWORD
if (process.env.AUTH) [USERNAME, PASSWORD] = process.env.AUTH.split(':')

/** Load static files * */
const homePage = fs.readFileSync('./html/index.html')
    .toString()
const favicon = fs.readFileSync('./html/favicon.ico')

/** Convert Object to base64 * */
const convertToBase64 = payload => Buffer.from(JSON.stringify(payload)).toString('base64')

const auth = (req) => {
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return false
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    const [username, password] = credentials.split(':')

    return !(username !== USERNAME || password !== PASSWORD)
}

/** send favicon * */
const sendFavicon = (req, res) => {
    res.writeHead(200)
    res.end(favicon)
}

/** Upload file handler * */
const handleUpload = async (container, req, res) => {
    const { database, storageChannel } = container
    const filename = replace(req.url.split('/')[1], ' ', '_')
    if (database[filename] || uploadLock.has(filename)) {
        res.writeHead(409)
        res.end('file exist or being uploaded by someone else')
    } else {
        uploadLock.add(filename)
        try {
            const { files, name } = await uploader(req, filename, storageChannel)
            database[name] = files
        } catch (err) {
            res.writeHead(500)
            res.end('Internal server error')
        } finally {
            uploadLock.delete(filename)
        }
        res.writeHead(303, { Connection: 'close', Location: '/' })
        res.end()
    }
}

/** Download file handler * */
const handleDownload = async (container, req, res) => {
    const { database } = container
    const fileName = path.basename(req.url)
    if (!database[fileName]) {
        res.status = 404
        res.end('404 not found')
    } else {
        downloadLock.add(fileName)
        res.status = 200
        await downloader(res, database[fileName], fileName)
        downloadLock.delete(fileName)
    }
}

/** Handle file delete * */
const handleDelete = async (container, req, res) => {
    const { database, storageChannel } = container
    const fileName = req.url.split('/')[1]
    if (!database[fileName]) {
        res.writeHead(404)
        res.end('404 not found')
    } else if (uploadLock.has(fileName) || downloadLock.has(fileName) || deleteLock.has(fileName)) {
        res.writeHead(409)
        res.end('file is being uploaded, downloaded or deleted')
    } else {
        deleteLock.add(fileName)
        try {
            await remover(fileName, storageChannel)
            delete database[fileName]
        } catch (err) {
            res.writeHead(500)
            res.end()
        } finally {
            deleteLock.delete(fileName)
        }

        res.writeHead(200)
        res.end()
    }
}

/** Send homepage * */
const generateHomepage = (container) => {
    const { database } = container
    let files = Object.keys(database)
    files = files.map(file => `<p><a href="/${file}">${file}</a></p>`)

    return homePage.replace('{{PLACE_HOLDER}}', files.join('\n'))
}

/** Get URI to be used in cli downloader * */
const handleURI = (container, req, res) => {
    const { database } = container
    const fileName = path.basename(req.url)
    const payload = { fileName, files: database[fileName] }
    res.writeHead(200)
    res.end(convertToBase64(payload))
}

/** Router * */
bot.build()
    .then((container) => {
        const onRequest = async (req, res) => {
            /** Validate auth if enabled * */
            if (USERNAME && PASSWORD && !auth(req)) {
                res.setHeader('WWW-Authenticate', 'Basic realm="DDrive Access", charset="UTF-8"')
                res.statusCode = 401
                res.end('Unauthorized access')

                return
            }

            try {
                if (req.url === '/favicon.ico') {
                    sendFavicon(req, res)
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
                    await handleDelete(container, req, res)
                } else if (req.method === 'POST') {
                    await handleUpload(container, req, res)
                } else if (req.method === 'GET' && req.url.startsWith('/uri/')) {
                    await handleURI(container, req, res)
                } else if (req.method === 'GET' && req.url !== '/') {
                    await handleDownload(container, req, res)
                } else if (req.method === 'GET') {
                    res.writeHead(200, { Connection: 'close' })
                    res.end(generateHomepage(container))
                } else {
                    res.writeHead(404)
                    res.end('not found')
                }
            } catch (err) {
                res.writeHead(500)
                res.end('internal server error')
            }
        }

        http.createServer(onRequest)
            .listen(process.env.PORT, () => {
                console.log(`App started at http://localhost:${process.env.PORT}`)
            })
    })
