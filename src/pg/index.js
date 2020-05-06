const { Pool } = require('pg');
const SQL = require('sql-template-strings');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');

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
/**
 * As per https://node-postgres.com/features/connecting
 * you can leave config undefined and the new pool will connect using PGUSER, PGHOST etc env variables.
 *
 * Or you can provide
 * {
 *   user: 'dbuser',
 *   host: 'database.server.com',
 *   database: 'mydb',
 *   password: 'secretpassword',
 *   port: 3211,
 * }
 * Or you can provide
 * {
 *   connectionString: 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb',
 * }
 */
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
    if (!pool) {
        connect();
    }
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

        const start = performance.now();

        const result = await query.apply(client, args);

        const duration = `${Math.round(performance.now() - start)}ms`;
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
            {
                clientId: client.id,
                lastQueryId: client.lastQueryId,
                lastQuery: client.lastQuery,
            }
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
    let result;

    try {
        result = await pgClient.query(text, params);
        release();
    } catch (err) {
        release(err);
        logger.error('bouquet/pg > error executing query', err, {
            text,
            params,
            clientId: pgClient.id,
        });
        throw err;
    }
    return result;
};

const queryAsRole = async (role, ...args) => {
    const [pgClient, release] = await getClient();

    let result;

    try {
        await pgClient.query('begin');
        await pgClient.query(
            `set local role ${pgClient.escapeIdentifier(role)}`
        );

        result = await pgClient.query.apply(pgClient, args);
        await pgClient.query('commit');
        release();
    } catch (err) {
        await pgClient.query('rollback');
        release(err);
        logger.error('bouquet/pg > error executing queryAsRole', err, {
            ...args,
            clientId: pgClient.id,
        });
        throw err;
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

    const { role: pgRole, localSettings } = getSettingsForPgClientTransaction({
        pgSettings,
    });

    const sqlSettingsQuery = getSqlSettingsQuery(localSettings);

    const [pgClient, release] = await getClient();

    let result;

    try {
        await pgClient.query('begin');
        await pgClient.query(
            `set local role ${pgClient.escapeIdentifier(pgRole)}`
        );
        // If there is at least one local setting, load it into the database.
        if (sqlSettingsQuery) {
            await pgClient.query(sqlSettingsQuery);
        }

        result = await pgClient.query.apply(pgClient, args);
        await pgClient.query('commit');
        release();
    } catch (err) {
        logger.error('bouquet/pg > error executing queryWithContext', err, {
            ...args,
            clientId: pgClient.id,
        });
        await pgClient.query('rollback');
        release(err);
        throw err;
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
