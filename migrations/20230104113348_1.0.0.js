const DIRECTORY_TABLE = 'directory'
const BLOCKS_TABLE = 'block'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    await knex.schema.createTable(DIRECTORY_TABLE, (table) => {
        table.uuid('id')
            .primary()
            .defaultTo(knex.raw('gen_random_uuid()'))

        table.string('name')
            .notNullable()
            .comment('Name of the file')

        table.uuid('parentId')
            .references('id')
            .inTable(DIRECTORY_TABLE)
            .onDelete('CASCADE')
            .index('directory_parent_id_idx')
            .comment('Id of the parent')
        table.enum('type', ['directory', 'file'])
            .notNullable()
            .comment('Type of the entry')
        table
            .timestamp('createdAt')
            .notNullable()
            .defaultTo(knex.fn.now())
            .comment('We want to know when this entry was created')

        table.unique(['name', 'parentId'])
    })

    await knex.schema.createTable(BLOCKS_TABLE, (table) => {
        table.uuid('id')
            .primary()
            .defaultTo(knex.raw('gen_random_uuid()'))
        table
            .uuid('fileId')
            .notNullable()
            .index('block_file_idx')
            .references('id')
            .inTable(DIRECTORY_TABLE)
            .onDelete('CASCADE')
            .comment('Id of the file from directory table')
        table
            .string('url')
            .notNullable()
            .comment('URL of the file')
        table
            .integer('size')
            .unsigned()
            .notNullable()
            .comment('Size of the block in Bytes')
        table.string('iv')
            .nullable()
            .comment('Iv to decrypt the block')
        table
            .timestamp('createdAt')
            .notNullable()
            .defaultTo(knex.fn.now())
            .comment('We want to know when this entry was created')
    })

    await knex(DIRECTORY_TABLE).insert({ name: 'root', type: 'directory' })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
    await knex.schema.dropTable(BLOCKS_TABLE)
    await knex.schema.dropTable(DIRECTORY_TABLE)
}
