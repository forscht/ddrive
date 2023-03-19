
/**
 * RegExp for basic auth credentials
 *
 * credentials = auth-scheme 1*SP token68
 * auth-scheme = "Basic" ; case insensitive
 * token68     = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
 * @private
 */

const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/

/**
 * RegExp for basic auth user/pass
 *
 * user-pass   = userid ":" password
 * userid      = *<TEXT excluding ":">
 * password    = *TEXT
 * @private
 */

const USER_PASS_REGEXP = /^([^:]*):(.*)$/

function decodeBase64(str) {
    return Buffer.from(str, 'base64').toString()
}

function parse(string) {
    if (typeof string !== 'string') return undefined

    // parse header
    const match = CREDENTIALS_REGEXP.exec(string)
    if (!match) return undefined

    // decode user pass
    const userPass = USER_PASS_REGEXP.exec(decodeBase64(match[1]))
    if (!userPass) return undefined

    // return credentials object
    return { user: userPass[1], pass: userPass[2] }
}

function auth(req) {
    // get header
    const header = req?.headers?.authorization

    // parse header
    return parse(header)
}

module.exports = auth
