const Knex = require('knex')
const config = require('../../../knexfile')

const environment = process.env.NODE_ENV

//
//  Expose The Knex connection object
//
module.exports = Knex(config[environment])
