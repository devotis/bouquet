if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const { connect, query, close } = require('../src/mssql');

connect();

const run = async () => {
    const result = await query('select 1 as');
    console.log(result);
    close();
};

run();
