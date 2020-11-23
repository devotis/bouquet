const sql = require('mssql');
const { performance } = require('perf_hooks');
const logger = require('./logger');
/**
 * What is a called a pool of *connections* in node-mssql is called a pool of *clients* in node-postgres.
 *
 * ## node-mssql
 * "When a query request is created, the SQL client uses the next available connection in the pool.
 * After the query is executed, the connection is returned to the connection to the pool."
 * https://developer.okta.com/blog/2019/03/11/node-sql-server
 *
 * ## node-Postgres
 * pool.connect acquires a client from the pool. If the pool is 'full' and all clients are currently checked out,
 * this will wait in a FIFO queue until a client becomes available by it being released back to the pool.
 * If there are idle clients in the pool it will be returned to the callback on process.nextTick.
 * If the pool is not full a new client will be created & returned to this callback.
 * https://node-postgres.com/api/pool
 */
const {
    MSSQL_WEB_USER: user,
    MSSQL_WEB_PASSWORD: password,
    MSSQL_SERVER: server,
    MSSQL_DATABASE: database,
    MSSQL_ADMIN_USER,
    MSSQL_ADMIN_PASSWORD,
} = process.env;

const defaultConfig = {
    user,
    password,
    server,
    database,
    options: { enableArithAbort: true },
};

let connect;
let cp;

const poolPromise = new Promise((resolve, reject) => {
    connect = (asAdmin, extraConfig = {}) => {
        const config = {
            ...defaultConfig,
            ...(asAdmin
                ? { user: MSSQL_ADMIN_USER, password: MSSQL_ADMIN_PASSWORD }
                : {}),
            ...extraConfig,
        };
        logger.info('bouquet/mssql > connecting', {
            user,
            server,
            database,
            asAdmin,
        });
        cp = new sql.ConnectionPool(config);

        cp.on('error', (err /*, client*/) => {
            logger.error('bouquet/mssql > pool connection error', err);
            process.exit(-1);
        });

        cp.connect()
            .then((pool) => {
                // note that the resolved `pool` is the same thing as `cp`
                // pool === cp > true
                // this is different from node-postgres where pool.connect resolves
                // to a new client
                const { password, ...rest } = pool.config;
                logger.info('bouquet/mssql > connected', rest);
                resolve(pool);
            })
            .catch((err) => {
                logger.error('bouquet/mssql > failed to connect ', err);
                reject(err);
            });

        return poolPromise;
    };
});
let queryCounter = 0;

const query = async (sql, title) => {
    const no = ++queryCounter;

    if (!sql) {
        logger.error('bouquet/mssql > missing sql statement to query');
        throw new Error('bouquet/mssql > missing sql statement to query');
    }

    logger.info('bouquet/mssql > executing query', {
        no,
        title,
        sql: sql
            .replace(/^\s+/g, '')
            .replace(/[\n\r]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .replace(/(.{70})..+/, '$1…'), // truncate if > 70 chars
    });

    const pool = await poolPromise;
    let result;

    const start = performance.now();
    try {
        result = await pool.query(sql);
    } catch (err) {
        logger.error('bouquet/mssql > query error', err, {
            no,
            title,
        });
        throw err;
    }
    const duration = `${Math.round(performance.now() - start)}ms`;

    logger.info('bouquet/mssql > query completed', {
        no,
        title,
        duration,
        recordsets: result.recordsets.length,
        records: result.recordsets.map((recordset) => recordset.length),
        rowsAffected: result.rowsAffected,
        returnValue: result.returnValue,
    });

    return result;
};

const close = async () => {
    const pool = await poolPromise;
    pool.close();
    logger.info('bouquet/mssql > pool closed');
};

const all = async (sql) => {
    const { recordset } = await query(sql);

    return recordset;
};

const one = async (sql) => {
    const { recordset } = await query(sql);

    return recordset && recordset[0];
};

const tag = async () => {
    const pool = await poolPromise;

    return pool.query.bind(pool);
};

module.exports = {
    cp,
    mssql: sql,
    connect,
    query,
    close,
    all,
    one,
    tag,
};
