const path = require('path')
const _ = require('lodash')
const knex = require('../src/http/api/utils/knex')

const normalizePath = (p, addLastSlash = false) => {
    let r = path.posix.normalize(p.replace(/\\/g, '/'))
    if (r.endsWith('/') && r !== '/') r = r.slice(0, -1)
    if (!r.endsWith('/') && addLastSlash) r = `${r}/`

    return r.startsWith('/') ? r : `/${r}`
}

const migrate = async () => {
    // Get file path from command line argv
    // node bin/migrate.js raw.json
    const metadataFilePath = process.argv[2]

    const metadata = require(path.relative(__dirname, metadataFilePath)) // eslint-disable-line global-require,import/no-dynamic-require

    const { files, directories } = metadata

    const createFile = async (file, parentId) => {
        try {
            await knex('directory').insert({
                id: file.id,
                name: file.name,
                type: 'file',
                parentId,
            })
        } catch (err) {
            if (err.code === '23505') {
                console.log('Duplicate file found', file.name)

                return
            }
            throw err
        }

        let { parts } = file
        parts = _.orderBy(parts, 'partNumber')
        parts = parts.map((p) => ({
            size: p.size,
            url: p.url,
            fileId: file.id,
        }))

        await knex('block').insert(parts)
    }

    const getChildDirectories = (directoryName) => {
        const normalizedDirectoryName = normalizePath(directoryName, true)
        const children = []
        directories.forEach((item) => {
            if (item.name !== normalizedDirectoryName && item.name.startsWith(normalizedDirectoryName) && item.name.trim() !== '') {
                let { name } = item
                if (name.indexOf(normalizedDirectoryName) === 0) name = name.substring(normalizedDirectoryName.length)
                if (name.indexOf('/') === 0) name = name.substring(1)
                if (!name.includes('/')) children.push(name)
            }
            // if (this.isChildOf(item.name, normalizedDirectoryName)) children.push(path.basename(item.name))
        })

        return children
    }

    const createDir = async (dirName = '/', parentId = null) => {
        try {
            const dir = directories.find((d) => d.name === dirName)
            if (!dir) return
            // Skip creating root dir
            if (dirName === '/') dir.id = parentId
            else {
                await knex('directory').insert({
                    id: dir.id, name: path.basename(dirName), parentId, type: 'directory',
                })
            }
            const childFiles = files.filter((f) => f.directoryId === dir.id)
            await Promise.all(childFiles.map((f) => createFile(f, dir.id)))
            const childDirectories = getChildDirectories(dirName)
                .map((d) => path.normalize(`${dirName}/${d}`))
            await Promise.all(childDirectories.map(async (d) => createDir(d, dir.id)))
        } catch (err) {
            console.log('Error => ', dirName)
            throw err
        }
    }

    const rootDir = await knex('directory').whereNull('parentId').first()
    await createDir('/', rootDir.id)

    console.log('------------- Migration Done -------------------')
    process.exit(0)
}

migrate().then()
