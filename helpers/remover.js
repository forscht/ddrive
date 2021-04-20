const { groupBy } = require('lodash')
const path = require('path')
const ora = require('ora')

module.exports = async (fileName, channel) => {
    const spinner = ora(`removing ${fileName}`)
        .start()

    try {
        let messages = channel.messages
            .cache
            .map(message => message)
            .filter(message => message.attachments.size !== 0)

        messages = groupBy(messages, (message) => {
            const { url } = message.attachments.first()
            const baseName = path.basename(url).split('.')
            baseName.splice(-1, 1)

            return baseName.join('.')
        })

        await Promise.all(messages[fileName]
            .map(async (message) => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * (10000 - 100) + 100))
                await message.delete()
            }))

        spinner.succeed()

        return messages
    } catch (err) {
        spinner.fail()

        return null
    }
}
