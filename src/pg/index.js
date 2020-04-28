const { Pool } = require('pg');
const SQL = require('sql-template-strings');
const uuidv4 = require('uuid/v4');

const logger = require('../logger');
const {
    getPgSettingsFromReq,
    getSettingsForPgClientTransaction,
    getSqlSettingsQuery,
} = require('./_private');

let pool;

const { env } = process;
const getConnectionString = ({
    userKey = 'PGUSER',
    passwordKey = 'PGPASSWORD',
    hostKey = 'PGHOST',
    dbKey = 'PGDATABASE',
    applicationName = 'bouquet',
}) => {
    const connectionString = [
        'postgres://',
        env[userKey],
        ':',
        env[passwordKey],
        '@',
        env[hostKey],
        '/',
        env[dbKey],
        '?application_name=',
        applicationName,
    ].join('');

    return connectionString;
};

const connect = config => {
    if (pool) {
        logger.info('bouquet/pg > pool already connected');
        return;
    }
    pool = new Pool(config);
    logger.info('bouquet/pg > pool connected');

    pool.on('error', (err /*, client*/) => {
        logger.error('bouquet/pg > unexpected error on idle client', err);
        process.exit(-1);
    });
    return pool;
};

const getClient = async () => {
    let client;
    try {
        client = await pool.connect();
    } catch (err) {
        logger.error('bouquet/pg > failed to connect ', err);
        throw err;
    }

    const query = client.query;
    client.id = client.id || uuidv4();

    logger.info('bouquet/pg > got new client from pool', {
        clientId: client.id,
    });

    // monkey patch the query method to keep track of the last query executed
    client.query = async (...args) => {
        client.lastQuery = args;
        client.lastQueryId = uuidv4();

        const start = Date.now();

        const result = await query.apply(client, args);

        const duration = Date.now() - start;
        logger.info('bouquet/pg > query completed', {
            clientId: client.id,
            queryId: client.lastQueryId,
            duration,
            rowCount: result && result.rowCount,
            ...args,
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
        logger.info('bouquet/pg > client released', {
            clientId: client.id,
            lastQueryId: client.lastQueryId,
            err,
        });
    };

    return [client, release];
};
// https://node-postgres.com/guides/project-structure
const query = async (text, params) => {
    const [pgClient, release] = await getClient();
    const result = await pgClient.query(text, params);
    release();

    return result;
};

const queryAsRole = async (role, ...args) => {
    const [pgClient, release] = await getClient();
    await pgClient.query('begin');

    let result;

    try {
        await pgClient.query(
            `set local role ${pgClient.escapeIdentifier(role)}`
        );

        result = await pgClient.query.apply(pgClient, args);
    } catch (err) {
        logger.error('bouquet/pg > error executing query', err, args);
    } finally {
        // Cleanup our Postgres client by ending the transaction and releasing
        // the client back to the pool. Always do this even if the query fails.
        try {
            await pgClient.query('commit');
            release();
        } catch (err) {
            release(err);
        }
    }
    return result;
};

const queryWithContext = async (
    req,
    reqParts,
    getRole,
    defaultSettings,
    ...args
) => {
    const pgSettings = getPgSettingsFromReq(
        req,
        reqParts,
        getRole,
        defaultSettings
    );

    logger.info(`bouquet/pg > executing queryWithContext`, pgSettings);

    const { role: pgRole, localSettings } = getSettingsForPgClientTransaction({
        pgSettings,
    });

    const sqlSettingsQuery = getSqlSettingsQuery(localSettings);

    const [pgClient, release] = await getClient();
    await pgClient.query('begin');

    let result;

    try {
        await pgClient.query(
            `set local role ${pgClient.escapeIdentifier(pgRole)}`
        );
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

module.exports = {
    getConnectionString,
    connect,
    getClient,
    query,
    queryAsRole,
    queryWithContext,
    sql: SQL,
};
