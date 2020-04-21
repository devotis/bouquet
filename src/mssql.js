const logger = require('heroku-logger');
const sql = require('mssql');

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

const poolPromise = new Promise((resolve, reject) => {
    connect = (asAdmin, extraConfig = {}) => {
        const config = {
            ...defaultConfig,
            ...(asAdmin
                ? { user: MSSQL_ADMIN_USER, password: MSSQL_ADMIN_PASSWORD }
                : {}),
            ...extraConfig,
        };
        logger.info('bouquet - mssql - connecting', {
            user,
            server,
            database,
            asAdmin,
        });
        new sql.ConnectionPool(config)
            .connect()
            .then(pool => {
                logger.info('bouquet - mssql - connected');
                resolve(pool);
            })
            .catch(err => {
                logger.error(
                    'bouquet - mssql - connection Failed! Bad Config: ',
                    err
                );
                reject(err);
            });
    };
});
let queryCounter = 0;

const query = async (sql, title) => {
    const no = ++queryCounter;

    if (!sql) {
        logger.error('bouquet - mssql - missing sql statement to query');
        throw new Error('bouquet - mssql - missing sql statement to query');
    }

    logger.info('bouquet - mssql - executing query', {
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

    try {
        result = await pool.query(sql);
    } catch (err) {
        logger.error('bouquet - mssql - query error', {
            no,
            title,
        });
        logger.error(err);
        throw err;
    }

    logger.info('bouquet - mssql - query completed', {
        no,
        title,
        recordsets: result.recordsets.length,
        records: result.recordsets.map(recordset => recordset.length),
        rowsAffected: result.rowsAffected,
        returnValue: result.returnValue,
    });

    return result;
};

const close = async () => {
    const pool = await poolPromise;
    pool.close();
    logger.info('bouquet - mssql - pool closed');
};

const all = async sql => {
    const { recordset } = await query(sql);

    return recordset;
};

const one = async sql => {
    const { recordset } = await query(sql);

    return recordset && recordset[0];
};

const tag = async () => {
    const pool = await poolPromise;

    return pool.query.bind(pool);
};

module.exports = {
    connect,
    query,
    close,
    all,
    one,
    tag,
};