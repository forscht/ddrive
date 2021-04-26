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

    /** Filter messages without attachment and convert Collection to attachment * */
    const attachments = messages
        .filter(message => message.attachments.size !== 0)
        .map(message => message.attachments.first())
    /** Get total files size and files count * */
    const dataSize = attachments.reduce((size, attachment) => size + attachment.size, 0)
    const { length } = attachments

    /** Group by files * */
    let attachmentsGroups = groupBy(attachments, (attachment) => {
        const baseName = path.basename(attachment.url).split('.')
        baseName.splice(-1, 1)

        return baseName.join('.')
    })

    /** Extract extra data and sort files* */
    attachmentsGroups = mapValues(attachmentsGroups, (attachmentGroup) => {
        const sortedFiles = sortBy(attachmentGroup.map(attachment => attachment.url), (URL) => {
            const separator = path.basename(URL).split('.').splice(-1, 1)[0]

            return parseInt(separator, 10)
        })
        const attachmentGroupSize = attachmentGroup.reduce((size, attachment) => size + attachment.size, 0)

        return { files: sortedFiles, size: attachmentGroupSize, length: attachmentGroup.length }
    })

    return { data: attachmentsGroups, meta: { size: dataSize, length } }
}
