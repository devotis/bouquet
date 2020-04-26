require('dotenv').config();
const sql = require('pg-sql2');

const { env } = process;

const getConnectionString = (
    userKey = 'PGUSER',
    passwordKey = 'PGPASSWORD',
    hostKey = 'PGHOST',
    dbKey = 'PGDATABASE',
    applicationName = 'bouquet'
) => {
    const connectionString = [
        'postgres://',
        env[userKey],
        ':',
        env[passwordKey],
        '@',
        env[hostKey],
        '/',
        env[dbKey],
        '?ssl=true&application_name=',
        applicationName,
    ].join('');

    return connectionString;
};

const valueSafeForSet = value =>
    value == null // of undefined dus
        ? ''
        : typeof value === 'object'
        ? JSON.stringify(value)
        : value;

const getSettingsFromRequest = (req, which) => {
    return [
        // pgp.as.format(`set local "role" = $<appRole>;`),
        ...Object.entries(req.headers || {}).map(([key, value]) => [
            `request.header.${key}`,
            valueSafeForSet(value),
        ]),
        ...Object.entries(req.user || {}).map(([key, value]) => [
            `request.user.${key}`,
            valueSafeForSet(value),
        ]),
        ...Object.entries(req.query || {}).map(([key, value]) => [
            `request.query.${key}`,
            valueSafeForSet(value),
        ]),
        [`request.sessionID`, valueSafeForSet(req.sessionID)],
    ];
};

// compiled from https://github.com/graphile/postgraphile/blob/51bd1dc96de194f75fdb1759e0ce9f555b2cf82b/src/postgraphile/withPostGraphileContext.ts
const getSqlSettingsQuery = localSettings => {
    const sqlSettings = [];
    if (localSettings.length > 0) {
        // Later settings should win, so we're going to loop backwards and not
        // add settings for keys we've already seen.
        const seenKeys = [];
        // TODO:perf: looping backwards is slow
        for (let i = localSettings.length - 1; i >= 0; i--) {
            const [key, value] = localSettings[i];
            if (!seenKeys.includes(key)) {
                seenKeys.push(key);
                // Make sure that the third config is always `true` so that we are only
                // ever setting variables on the transaction.
                // Also, we're using `unshift` to undo the reverse-looping we're doing
                sqlSettings.unshift(
                    sql.fragment`set_config(${sql.value(key)}, ${sql.value(
                        value
                    )}, true)`
                );
            }
        }
    }

    const sqlSettingsQuery =
        sqlSettings.length > 0
            ? sql.compile(sql.query`select ${sql.join(sqlSettings, ', ')}`)
            : null;

    return sqlSettingsQuery;
};

module.exports = {
    getConnectionString,
    getSqlSettingsQuery,
    getSettingsFromRequest,
    valueSafeForSet,
};
