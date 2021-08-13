const { REST } = require('@discordjs/rest')
const querystring = require('querystring')

class DiscordAPI {
    /**
     * Creates discord rest API wrapper
     * @param token
     */
    constructor(token) {
        this.rest = new REST({ version: 9 }).setToken(token)
    }

    /**
     * Send message with single attachment
     * @param {String} channelId
     * @param {Buffer} attachment
     * @param {Object} body
     * @return {Promise<*>}
     */
    async sendSingleAttachmentMessage(channelId, attachment, body = {}) {
        const endpoint = `/channels/${channelId}/messages`

        return this.rest.post(endpoint, {
            attachments: [attachment],
            body,
        })
    }

    /**
     * Fetch messages
     * @param {String} channelId
     * @param {Object} query
     * @return {Promise<*>}
     */
    async fetchMessages(channelId, query) {
        const endpoint = `/channels/${channelId}/messages`

        return this.rest.get(endpoint, { query: querystring.encode(query) })
    }

    /**
     * Delete message for given messageId
     * @param {String} channelId
     * @param {String} messageId
     * @return {Promise<*>}
     */
    async deleteMessage(channelId, messageId) {
        const endpoint = `/channels/${channelId}/messages/${messageId}`

        return this.rest.delete(endpoint)
    }
}

module.exports = DiscordAPI
