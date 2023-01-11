require('dotenv').config({ path: './config/.env' })

module.exports = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        ssl: false,
        migrations: {
            tableName: 'knex_migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
    docker: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
            tableName: 'knex_migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        ssl: true,
        migrations: {
            tableName: 'knex_migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
}
