const parseBasicAuth = require('../utils/basicAuth')

module.exports = ({ auth, publicAccess }) => async (req, reply, done) => {
    // If creds are not given skip this route
    if (!auth.user && !auth.pass) return
    // Check if route is public or not
    const { routeConfig: { ACCESS_TAGS } } = req
    if (ACCESS_TAGS && ACCESS_TAGS.includes(publicAccess)) return
    // Verify credentials
    const authorization = parseBasicAuth(req)
    if ((!authorization)
        || authorization.user !== auth.user
        || authorization.pass !== auth.pass) {
        // Throw error if invalid
        reply.header('WWW-Authenticate', 'Basic realm="DDrive Login"')
        const error = new Error('Missing or bad formatted authorization header')
        error.statusCode = 401
        done(error)
    }
}
