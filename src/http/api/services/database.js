const knex = require('../utils/knex')

/**
 *
 * @param id {String}
 * @param size {Boolean}
 * @param parts {Boolean}
 * @returns {Promise<void>}
 */
const getFile = async (id, size = false, parts = false) => {
    const query = knex(`directory as d`)
        .select('d.*')
        .leftJoin(`block as b`, 'd.id', 'b.fileId')
        .where('d.id', '=', id)
        .groupBy('d.id')
        .first()
    if (size) query.select(knex.raw(`sum(b.size) as size`))
    if (parts) query.select(knex.raw(`jsonb_agg(to_jsonb(b) - 'fileId') as parts`))

    return query
}

/**
 * Get directory with or without child
 * @param id
 * @param child
 * @returns {Promise<void>}
 */
const getDirectory = async (id = null, child = false) => {
    //
    // Knex Base Query
    //
    const query = knex(`directory`)
        .select('*')
        .first()
    //
    // If id is not provided return result for root dir
    //
    if (id) query.where('id', '=', id)
    if (!id) query.whereNull('parentId')
    //
    // Fetch child if asked for
    //
    if (child && !id) {
        query.select(knex.raw(
            `(select json_agg(r) FROM (select "d".*, sum(b.size) as size
                         from "directory" as "d"
                                  left join "block" as "b" on "d"."id" = "b"."fileId"
                         where "d"."parentId" = (select "id" from "directory" where "parentId" is null)
                         group by "d"."id") r ) as child`,
        ))
    }
    if (child && id) {
        query.select(knex.raw(
            `(select json_agg(r) FROM (select "d".*, sum(b.size) as size
                         from "directory" as "d"
                                  left join "block" as "b" on "d"."id" = "b"."fileId"
                         where "d"."parentId" = ?
                         group by "d"."id") r ) as child`, [id],
        ))
    }

    return query
}

/**
 * Create directory in db
 * @param data {Object}
 * @param type {String}
 * @returns {Promise<*>}
 */
const createDirectoryOrFile = async (data, type = 'directory') => {
    try {
        const [directory] = await knex('directory')
            .insert({ ...data, type })
            .returning('*')

        return directory
    } catch (err) {
        // Handle SQL error for unique key constraint
        if (err.code === '23505') {
            err.message = 'Directory or file with same name already exist'
            err.statusCode = 400
        }
        throw err
    }
}

/**
 * Delete directory for given directoryId
 * @param id {String}
 * @param type {String}
 * @returns {Promise<void>}
 */
const deleteDirectory = async (id, type = 'directory') => {
    await knex('directory')
        .where({ id, type })
        .whereNotNull('parentId') // Do not let user delete root dir
        .delete()
        .catch() // Ignore error if directory id is invalid guid
}

/**
 * Update directory record for given fileId or directoryId
 * @param id {String}
 * @param data {Object}
 * @returns {Promise<*>}
 */
const updateDirectoryOrFile = async (id, data) => {
    try {
        const [directory] = await knex('directory')
            .update(data)
            .where({ id })
            .whereNotNull('parentId') // Do not let user delete root dir
            .returning('*')

        return directory
    } catch (err) {
        // Handle SQL error for unique key constraint
        if (err.code === '23505') {
            err.message = 'Directory or file with same name already exist'
            err.statusCode = 400
        }
        throw err
    }
}

const createFileWithParts = async (data, parts) => {
    const file = await createDirectoryOrFile(data, 'file')
    await knex('block').insert(parts.map((p) => ({ fileId: file.id, ...p })))

    return getFile(file.id, true, false)
}

module.exports = {
    getFile, getDirectory, createDirectoryOrFile, deleteDirectory, updateDirectoryOrFile, createFileWithParts,
}
