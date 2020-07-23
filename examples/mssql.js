require('dotenv').config();
const logger = require('@devotis/bouquet').logger;
const { connect, close } = require('@devotis/bouquet').mssql;
const { tag } = require('@devotis/bouquet').mssql;

const run = async () => {
    try {
        connect();

        const sql = await tag();

        const result = await sql`
        select top 1 *
        from dbo.my_table
    `;

        logger.info(JSON.stringify(result));
    } catch (error) {
        logger.error(error);
    } finally {
        close();
    }
};

run();
