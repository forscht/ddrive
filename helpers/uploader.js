const Chunker = require('stream-chunker')
const through2 = require('through2')
const ora = require('ora')

module.exports = async (stream, fileName, channel) => {
    const chunker = Chunker(process.env.CHUNK_SIZE ? parseInt(process.env.CHUNK_SIZE, 10) : 7864320, { flush: true })

    let count = 0
    const uploadedMessage = []
    const spinner = ora(`uploading ${fileName}`).start()

    const handleAbort = async (cb) => {
        spinner.fail(`upload failed ${fileName}`)
        await Promise.all(uploadedMessage.map(async message => message.delete()))
        cb()
    }

    return new Promise((resolve, reject) => {
        stream /** On request abort delete all the messages and resolve* */
            .on('aborted', () => handleAbort(reject))
            .pipe(chunker)
            .pipe(through2(async (data, encoding, callback) => {
                try {
                    const message = await channel.send({ files: [{ name: `${fileName}.${count}`, attachment: data }] })
                    uploadedMessage.push(message)
                    count += 1
                    callback()
                } catch (err) {
                    await handleAbort(reject)
                }
            }))
            .on('finish', () => {
                /** When we upload files to discord with space it will replace it with _ * */
                spinner.succeed(`uploaded ${fileName}`)
                let uploadedFileName = uploadedMessage[0].attachments.first().name.split('.')
                uploadedFileName.splice(-1, 1)
                uploadedFileName = uploadedFileName.join('.')
                resolve({
                    name: uploadedFileName,
                    files: uploadedMessage.map(message => message.attachments.first().url),
                    size: uploadedMessage.reduce((size, message) => size + message.attachments.first().size, 0),
                })
            })
            .on('error', () => handleAbort(reject))
    })
}
