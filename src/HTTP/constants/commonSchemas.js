module.exports = [
    {
        $id: 'CommonError',
        type: 'object',
        properties: {
            message: { type: 'string' },
        },
    },
    {
        $id: 'File',
        type: 'object',
        required: ['id', 'name', 'parentId', 'size'],
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            parentId: { type: 'string' },
            size: { type: 'number' },
            createdAt: { type: 'string' },
        },
    },
    {
        $id: 'Directory',
        required: ['name', 'parentId'],
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            parentId: { type: 'string' },
            child: {
                type: ['object', 'null'],
                properties: {
                    directories: {
                        type: 'array',
                        items: { $ref: 'Directory#' },
                    },
                    files: {
                        type: 'array',
                        items: { $ref: 'File#' },
                    },
                },
            },
            createdAt: { type: 'string' },
        },
    },
]
