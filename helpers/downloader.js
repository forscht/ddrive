/* eslint-disable no-await-in-loop */
const request = require('request-promise-native')
const ora = require('ora')

module.exports = async (stream, files, fileName) => {
    const spinner = ora(`downloading ${fileName}`).start()

    try {
        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            const data = await request.get(file, { encoding: null })
            stream.write(data)
        }
        stream.end()
        spinner.succeed(`downloaded ${fileName}`)
    } catch (err) {
        spinner.fail(`downloaded ${fileName} failed`)
        stream.writeHead(500, { Connection: 'close' })
        stream.end()
    }
}
