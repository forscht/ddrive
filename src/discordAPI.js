const { REST } = require('@discordjs/rest')
const querystring = require('querystring')

class DiscordAPI {
    /**
     * Create discord API wrapper
     * @param opts
     */
    constructor(opts) {
        this.channelId = opts.channelId
        this.rest = new REST({ version: 10, timeout: 30000, ...opts.restOpts }).setToken(opts.token)
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
}

module.exports = DiscordAPI
