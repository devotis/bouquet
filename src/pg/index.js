const logger = require('../logger');
const { getSettingsFromRequest, getSqlSettingsQuery } = require('./_private');

const { Pool } = require('pg');
const pool = new Pool();

pool.on('error', (err /*, client*/) => {
    logger.error('bouquet/pg > unexpected error on idle client', err);
    process.exit(-1);
});

// https://node-postgres.com/guides/project-structure
const query = async (text, params) => {
    const start = Date.now();

    const result = await pool.query(text, params);

    const duration = Date.now() - start;
    logger.info('bouquet/pg > executed query', {
        text,
        duration,
        rows: result.rowCount,
    });

    return result;
};

const getClient = async () => {
    const client = await pool.connect();
    //  (err, client, release) => {
    const query = client.query;
    // monkey patch the query method to keep track of the last query executed
    client.query = async (...args) => {
        client.lastQuery = args;

        const start = Date.now();
        const result = await query.apply(client, args);

        const duration = Date.now() - start;
        logger.info('bouquet/pg > executed query', {
            ...args,
            duration,
            rows: result.rowCount,
        });

        return result;
    };
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        logger.error(
            'bouquet/pg > a client has been checked out for more than 5 seconds!',
            { lastQuery: client.lastQuery }
        );
    }, 5000);
    const release = err => {
        // call the actual 'release' method, returning this client to the pool
        client.release(err);
        // clear our timeout
        clearTimeout(timeout);
        // set the query method back to its old un-monkey-patched version
        client.query = query;
    };

    return [client, release];
};

const queryWithContext = async (req, getRole, ...args) => {
    const role = typeof getRole === 'string' ? getRole : getRole(req);

    const settings = getSettingsFromRequest(
        req,
        ['headers', 'query', 'body', 'session'],
        { timezone: 'Europe/Amsterdam', role }
    );

    logger.info(`bouquet/pg > error executing queryWithContext`, {
        role,
        args,
        settings,
    });

    const sqlSettingsQuery = getSqlSettingsQuery(settings);

    const [pgClient, release] = await getClient();
    await pgClient.query('begin');

    let result;

    try {
        await pgClient.query(`set role ${pgClient.escapeIdentifier(role)}`);
        // If there is at least one local setting, load it into the database.
        if (sqlSettingsQuery) {
            await pgClient.query(sqlSettingsQuery);
        }

        result = await pgClient.query.apply(pgClient, args);
    } catch (err) {
        logger.error('bouquet/pg > error executing query', err, args);
    } finally {
        // Cleanup our Postgres client by ending the transaction and releasing
        // the client back to the pool. Always do this even if the query fails.
        try {
            await pgClient.query('commit');
        } finally {
            release();
        }
    }
    return result;
};

// const doBlock = query =>
//     db.any(
//         sql`
//         do $do$ begin
//             ${query}
//         end $do$;
//     `
//     );

module.exports = {
    getClient,
    query,
    queryWithContext,
    // doBlock,
};
