const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: './config/.env' })
const _ = require('lodash')

// Valid public access mode
const VALID_PUBLIC_ACCESS = ['READ_ONLY_FILE', 'READ_ONLY_PANEL']

// If webhook file exist load webhook urls from file
const loadWebhooks = () => {
    const filePath = path.join(process.cwd(), 'webhook.txt')
    const fileExist = fs.existsSync(filePath)
    if (!fileExist) return undefined
    const webhookFileBuffer = fs.readFileSync(filePath)

    return webhookFileBuffer.toString().split('\n')
}

const HttpConfig = () => {
    const {
        PORT = 3000,
        AUTH = '',
        PUBLIC_ACCESS,
        DATABASE_URL,
    } = process.env

    // Check if database url exist.
    if (!DATABASE_URL) throw new Error('Database URL is missing')

    // Validate correct public access is supplied
    if (PUBLIC_ACCESS
        && !VALID_PUBLIC_ACCESS.includes(PUBLIC_ACCESS)) {
        throw new Error(`Invalid PUBLIC_ACCESS ${PUBLIC_ACCESS} supplied. Possible values are - ${VALID_PUBLIC_ACCESS.join(' ')}`)
    }
    // Prepare username password from auth
    const [user, pass] = AUTH.split(':')

    return {
        authOpts: {
            auth: { user, pass },
            publicAccess: PUBLIC_ACCESS,
        },
        port: PORT,
    }
}

const DFsConfig = () => {
    const {
        CHUNK_SIZE,
        UPLOAD_CONCURRENCY = '',
        REQUEST_TIMEOUT = '',
        SECRET = '',
        WEBHOOKS = '',
    } = process.env

    // Get webhook URLs
    let webhooks = loadWebhooks()
    if (!webhooks) webhooks = WEBHOOKS.split(',')
    webhooks = webhooks.filter((w) => !!w)
    if (!webhooks || !webhooks.length) {
        throw new Error('Webhook URLs missing. Webhook URLs seperated by "," in .env and seperated by "\n" webhook.txt file supported')
    }
    // If chunkSize is invalid set the default chunkSize
    let chunkSize = parseInt(CHUNK_SIZE, 10)
    if (!_.isFinite(chunkSize)
        || chunkSize < 1
        || chunkSize > 26109542) chunkSize = 25165824 // 24 MB

    // Set proper request timeout
    let timeout = parseInt(REQUEST_TIMEOUT, 10)
    if (!_.isFinite(timeout) || timeout < 1) timeout = 60000

    let maxConcurrency = parseInt(UPLOAD_CONCURRENCY, 10)
    if (!_.isFinite(maxConcurrency) || maxConcurrency < 1) maxConcurrency = 3

    return {
        chunkSize,
        webhooks,
        secret: SECRET,
        maxConcurrency,
        restOpts: {
            timeout,
        },
    }
}

module.exports = () => ({
    httpConfig: HttpConfig(),
    DFsConfig: DFsConfig(),
})
