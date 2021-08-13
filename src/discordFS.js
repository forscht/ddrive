/* eslint-disable no-await-in-loop,no-restricted-syntax */
const Chunker = require('stream-chunker')
const through2 = require('through2')
const {
    groupBy, mapValues, sortBy, replace,
} = require('lodash')
const path = require('path')
const request = require('request-promise-native')
const debug = require('debug')('discordFS')
const DiscordAPI = require('./discordAPI')

class DiscordFS {
    /**
     * Creates discordFS for given channelId
     * @param {Object} opts
     */
    constructor(opts) {
        /**
         * Set FS Options
         */
        this.token = opts.token
        this.channelId = opts.channelId
        this.chunkSize = opts.chunkSize || 7864320 // Default 7.5MB

        /**
         * Initialize file index and
         * locks to handle concurrency
         */
        this.filesIndex = {}
        this.uploadLock = new Set()
        this.deleteLock = new Set()

        /**
         * @type {DiscordAPI}
         */
        this.discordAPI = new DiscordAPI(this.token)
    }

    /**
     * Load file attachments data in memory cache
     * @return {Promise<void>}
     */
    async buildIndex() {
        debug('>>> booting discordFS')
        let tempMessageCache = []
        /**
         * Fetch all messages from channel and store in temp cache
         */
        let channelMessages = await this.discordAPI.fetchMessages(this.channelId, { limit: 100 })
        while (channelMessages.length > 0) {
            tempMessageCache.push(...channelMessages)
            // eslint-disable-next-line no-await-in-loop
            channelMessages = await this.discordAPI.fetchMessages(
                this.channelId,
                {
                    limit: 100,
                    before: tempMessageCache[tempMessageCache.length - 1].id,
                },
            )
        }

        /**
         * Remove empty messages without attachments
         */
        tempMessageCache = tempMessageCache
            .filter((message) => message.attachments.length !== 0)
            .map((message) => ({
                messageId: message.id,
                channelId: message.channel_id,
                ...message.attachments[0],
            }))

        /**
         * Group messages by filenames
         * and sort messages by file part number
         */
        tempMessageCache = groupBy(tempMessageCache, (attachment) => this.getFileNameFromURL(attachment.url))
        tempMessageCache = mapValues(tempMessageCache, (fileMessages) => {
            /**
             * Sort messages by file part number
             */
            const sortedFiles = sortBy(fileMessages, (fileMessage) => {
                const { url } = fileMessage
                const separator = path.basename(url).split('.').splice(-1, 1)[0]

                return parseInt(separator, 10)
            })

            return { attachments: sortedFiles }
        })

        this.filesIndex = tempMessageCache
        debug('>>> File Index build complete')
    }

    /**
     * Read from stream in chunks and upload file to discord in parts
     * @param stream
     * @param {String} fileName
     * @return {Promise<Object|Error>}
     */
    async addFile(stream, fileName) {
        if (this.uploadLock.has(fileName)) this.throwError(`${fileName} upload is already in progress`, 'UPLOAD_IN_PRGORESS')
        else this.uploadLock.add(fileName)
        debug('>> [ADD] in progress :', fileName)
        const cleanFileName = this.sanitizeFileName(fileName)
        if (this.filesIndex[cleanFileName]) this.throwError(`${fileName} already exist`, 'FILE_EXIST')
        const uploadedMessage = []
        let count = 0

        /** Handle Error if we failed to upload file,
         *  Delete already uploaded parts
         */
        const handleAbort = async (cb, err) => {
            await Promise.all(uploadedMessage.map(async (message) => this.discordAPI.deleteMessage(message.channel_id, message.id)))
            cb(err)
        }

        /**
         * Create chunks of file and upload asynchronously
         */
        return new Promise((resolve, reject) => {
            const chunker = Chunker(this.chunkSize, { flush: true })
            stream
                .on('aborted', () => handleAbort(reject)) // On HTTP request abort delete all the messages and reject promise
                .pipe(chunker)
                .pipe(through2(async (data, encoding, callback) => {
                    try {
                        const message = await this.discordAPI.sendSingleAttachmentMessage(
                            this.channelId, {
                                fileName: `${cleanFileName}.${count}`,
                                rawBuffer: data,
                            },
                        )
                        uploadedMessage.push(message)
                        count += 1
                        callback()
                    } catch (err) {
                        await handleAbort(reject, err)
                    }
                }))
                .on('finish', () => {
                    const fileData = {
                        name: cleanFileName,
                        attachments: uploadedMessage.map((message) => ({
                            messageId: message.id,
                            channelId: message.channel_id,
                            ...message.attachments[0],
                        })),
                    }
                    /**
                     * Add new file data in files meta cache
                     * and remove lock on filename
                     */
                    this.filesIndex[cleanFileName] = fileData
                    this.uploadLock.delete(fileName)
                    debug('>> [ADD] completed   :', fileName)
                    resolve(fileData)
                })
                .on('error', (err) => handleAbort(reject, err))
        })
    }

    /**
     * Download files from discord and write parts to given writable stream
     * @param stream
     * @param {String} fileName
     * @return {Promise<void>}
     */
    async fetchFile(stream, fileName) {
        if (this.deleteLock.has(fileName)) this.throwError(`${fileName} delete in progress`, 'DELETE_IN_PROGRESS')
        debug('>> [FETCH] in progress :', fileName)
        const { attachments } = this.filesIndex[fileName]
        const files = attachments.map((attachment) => attachment.url)
        for (const file of files) {
            const data = await request.get(file, { encoding: null })

            if (!stream.write(data)) await new Promise((resolve) => stream.once('drain', resolve))
        }
        debug('>> [FETCH] completed   :', fileName)
        stream.end()
    }

    /**
     * Discord messages for given file from discord
     * @param {String} fileName
     * @return {Promise<void>}
     */
    async deleteFile(fileName) {
        if (this.deleteLock.has(fileName)) this.throwError(`${fileName} delete in progress`, 'DELETE_IN_PROGRESS')
        else this.deleteLock.add(fileName)
        debug('>> [DELETE] in progress :', fileName)
        const { attachments } = this.filesIndex[fileName]
        await Promise.all(attachments
            .map(async (attachment) => {
                await this.discordAPI.deleteMessage(attachment.channelId, attachment.messageId)
            }))

        delete this.filesIndex[fileName]
        this.deleteLock.delete(fileName)
        debug('>> [DELETE] completed   :', fileName)
    }

    /**
     * sanitize file name before uploading
     * @param {String} filename
     * @return {String}
     */
    sanitizeFileName(filename) {
        return replace(filename, ' ', '_')
    }

    /**
     * Get total file size
     * @param filename
     * @return {Number}
     */
    getFileSize(filename) {
        const { attachments } = this.filesIndex[filename]

        return attachments.reduce((size, attachment) => size + attachment.size, 0)
    }

    /**
     * Get total size of all the files
     * @return {Number}
     */
    getTotalFSSize() {
        const allAttachments = Object.values(this.filesIndex)

        return allAttachments.map((file) => file.attachments.reduce((size, attachment) => size + attachment.size, 0))
            .reduce((totalSize, fileSize) => totalSize + fileSize, 0)
    }

    /**
     * Custom discordFS error
     * @param {String} message
     * @param {String} code
     */
    throwError(message, code) {
        const error = new Error(message)
        error.code = code

        throw error
    }

    /**
     * Extract filename from file url
     * @param {String} url
     * @return {string}
     */
    getFileNameFromURL(url) {
        const baseName = path.basename(url).split('.')
        baseName.splice(-1, 1)

        return baseName.join('.')
    }
}

module.exports = DiscordFS
