require('dotenv').config()
const Discord = require('discord.js')
const ora = require('ora')
const indexBuilder = require('./helpers/buildIndex')

const bot = new Discord.Client({ messageCacheMaxSize: 2147483647 })

module.exports.build = async () => {
    const spinner = ora('Starting bot').start()
    await bot.login(process.env.TOKEN)
    spinner.text = 'Building file index'
    const storageChannel = await bot.channels.fetch(process.env.STORAGE_CHANNEL)
    const database = await indexBuilder(storageChannel)
    spinner.succeed('Bot is ready')

    return { database, storageChannel }
}
