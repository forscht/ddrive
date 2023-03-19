const Knex = require('knex')
const config = require('../../../../knexfile')

const environment = process.env.NODE_ENV || 'development'

//
//  Expose The Knex connection object
//
module.exports = Knex(config[environment])
