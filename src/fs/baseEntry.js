class BaseEntry {
    constructor(opts) {
        this.name = opts.name
        this.mid = opts.mid
    }

    get string() {
        return JSON.stringify(this)
    }
}

module.exports = BaseEntry
