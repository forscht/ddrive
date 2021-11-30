/* eslint-disable no-param-reassign */
const path = require('path')
const fs = require('fs')
const debugError = require('debug')('error')

class Util {
    /**
     * Pretty print error
     * @param error
     * @param extra
     */
    static errorPrint(error, extra = {}) {
        let err = `${'=== Begin Error ===\n---\n'
        + 'Error: '}${error.message}\n`
        const extraArray = Object.keys(extra).map((e) => `${e} : ${extra[e]}`).join('\n')
        err += extraArray
        err += `\nStack: ${error.stack}\n---\n=== End Error ===`

        debugError(err)
    }

    /**
     *  Format bytes as human-readable text.
     * @param bytes Number of bytes.
     * @param si True to use metric (SI) units, aka powers of 1000. False to use
     *           binary (IEC), aka powers of 1024.
     * @param dp Number of decimal places to display.
     * @returns {string} Formatted string.
     */
    static humanReadableSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024

        if (Math.abs(bytes) < thresh) {
            return `${bytes} B`
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
        let u = -1
        const r = 10 ** dp

        do {
            // eslint-disable-next-line no-param-reassign
            bytes /= thresh
            u += 1
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

        return `${bytes.toFixed(dp)} ${units[u]}`
    }

    /**
     * Normalize path
     * @param {String} p
     * @param {Boolean} addLastSlash
     * @return {string}
     */
    static normalizePath(p, addLastSlash = false) {
        let r = path.posix.normalize(p.replace(/\\/g, '/'))
        if (r.endsWith('/') && r !== '/') r = r.slice(0, -1)
        if (!r.endsWith('/') && addLastSlash) r = `${r}/`

        return r.startsWith('/') ? r : `/${r}`
    }

    /**
     * Safe parse JSON string
     * @param {String} string
     * @return {undefined|any}
     */
    static safeParse(string) {
        try {
            return JSON.parse(string)
        } catch (err) {
            return undefined
        }
    }

    /**
     * Explode path with sub directories
     * @param {String} p
     * @return {string[]}
     */
    static explodePath(p) {
        const pathArray = Util.normalizePath(p).split('/').filter((pe) => pe !== '')

        const explodedArray = pathArray
            .map((pe, index) => pathArray.slice(0, index + 1).join('/'))
            .map((pe) => `/${pe}`)
        explodedArray.unshift('/')

        return explodedArray
    }

    /**
     * Convert bytes to human readable format
     * @param bytes
     * @param si
     * @param dp
     * @return {string}
     */
    static humanFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024

        if (Math.abs(bytes) < thresh) {
            return `${bytes} B`
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
        let u = -1
        const r = 10 ** dp

        do {
            // eslint-disable-next-line no-param-reassign
            bytes /= thresh
            u += 1
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

        return `${bytes.toFixed(dp)} ${units[u]}`
    }

    /**
     * Sort array of object by key
     * @param {Object[]} array
     * @param {String} key
     * @return {*}
     */
    static sortArrayByKey(array, key) {
        return array.sort((a, b) => {
            if (a[key] < b[key]) { return -1 }
            if (a[key] > b[key]) { return 1 }

            return 0
        })
    }

    /**
     * Return array of all files in current dir
     * @param {String} dirPath
     * @param {String[]} arrayOfFiles
     * @return {String[]}
     */
    static getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath)

        files.forEach((file) => {
            if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
                arrayOfFiles = Util.getAllFiles(`${dirPath}/${file}`, arrayOfFiles)
            } else {
                arrayOfFiles.push(path.join(process.cwd(), dirPath, '/', file))
            }
        })

        return arrayOfFiles
    }
}

module.exports = Util

