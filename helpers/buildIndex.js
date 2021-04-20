const { groupBy, mapValues, sortBy } = require('lodash')
const Discord = require('discord.js')
const path = require('path')

module.exports = async (channel) => {
    let messages = new Discord.Collection()

    let channelMessages = await channel.messages.fetch({ limit: 100 })

    while (channelMessages.size > 0) {
        messages = messages.concat(channelMessages)
        // eslint-disable-next-line no-await-in-loop
        channelMessages = await channel.messages.fetch({
            limit: 100,
            before: channelMessages.last().id,
        })
    }
    channel.messages.cache.concat(messages)
    messages = messages
        .map(message => (message.attachments.first() ? message.attachments.first().url : null))
        .filter(attachment => attachment !== null)

    messages = groupBy(messages, (message) => {
        const baseName = path.basename(message).split('.')
        baseName.splice(-1, 1)

        return baseName.join('.')
    })

    messages = mapValues(messages, files => sortBy(files, (file) => {
        const separator = path.basename(file).split('.').splice(-1, 1)[0]

        return parseInt(separator, 10)
    }))

    return messages
}
