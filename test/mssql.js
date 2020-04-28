process.env.DEBUG = 'mssql:*';
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const tape = require('tape');

tape('mssql > integration', async t => {
    const { connect, query, close } = require('../src/mssql');

    connect();
    const result = await query('select 1 as x');
    close();

    t.deepEqual(
        result,
        {
            recordsets: [[{ x: 1 }]],
            recordset: [{ x: 1 }],
            output: {},
            rowsAffected: [1],
        },
        'query > correct output'
    );

    t.end();
});
