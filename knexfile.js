module.exports = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        ssl: false,
        migrations: {
            tableName: 'knex_migrations',
        },
        pool: {
            min: 1,
            max: 2,
        },
    },
    docker: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
            tableName: 'knex_migrations',
        },
        pool: {
            min: 1,
            max: 2,
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
            min: 1,
            max: 2,
        },
    },
}
