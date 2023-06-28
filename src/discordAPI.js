const _ = require('lodash')
const { REST } = require('@discordjs/rest')
const querystring = require('querystring')

const REST_OPTS = {
    version: 10,
    timeout: 60000, // Request will be aborted after this
}

class DiscordAPI {
    /**
     * Create discord API wrapper
     * @param opts
     */
    constructor(opts) {
        this.channelId = opts.channelId
        // Prepare rest opts
        const restOpts = _.defaults(opts.restOpts, REST_OPTS)

        // By default, @discordjs/rest package adds `Bot` in every outgoing
        // request's auth header but for user token it's not needed so remove the prefix
        const { type: tokenType, token } = this.extractUserToken(opts.token)
        if (tokenType === 'USER') restOpts.authPrefix = ''
        this.rest = new REST(restOpts).setToken(token)
    }

    /**
     * Fetch messages
     * @param {Object} query
     * @return {Promise<*>}
     */
    async fetchMessages(query) {
        const endpoint = `/channels/${this.channelId}/messages`

        return this.rest.get(endpoint, { query: querystring.encode(query) })
    }

    /**
     * Send message on channel
     * @param {Object|String} content
     * @param {Object[]} files
     * @return {Promise<*>}
     */
    async createMessage(content, files = []) {
        const endpoint = `/channels/${this.channelId}/messages`
        content = typeof content === 'string' ? JSON.parse(content) : content
        if (content.type === 'file') {
            const requestData = {
                files,
                body: {
                    embeds: [{
                        title: 'Upload File',
                        description: `Filename: \`${content.name}\`\nPart number: \`${content.partNumber}\`\nDirectory ID: \`${content.directoryId}\`\nFile ID: \`${content.fileId}\``,
                        color: 32768
                    }],
                }
            }

            return this.rest.post(endpoint, requestData)
        }
        else if (content.type === 'directory') {
            const requestData = {
                files,
                body: {
                    embeds: [{
                        title: 'Create Directory',
                        description: `Directory Name: \`${content.name}\`\nCreate At: \`${content.createdAt}\`\nDirectory ID: \`${content.id}\`\n`,
                        color: 32768
                    }],
                }
            }
            return this.rest.post(endpoint, requestData)
        }
    }

    /**
     * Delete message for given messageId
     * @param {String} messageId
     * @return {Promise<*>}
     */
    async deleteMessage(messageId) {
        const endpoint = `/channels/${this.channelId}/messages/${messageId}`

        return this.rest.delete(endpoint)
    }

    /**
     * Check type of token
     * @param {String} token
     * @returns {{type: string, token}}
     */
    extractUserToken(token) {
        const extracted = {
            token,
            type: 'BOT',
        }
        if (token.toLowerCase().startsWith('user ')) {
            extracted.type = 'USER'
            extracted.token = token.substring(5)
        }

        return extracted
    }
}

module.exports = DiscordAPI
