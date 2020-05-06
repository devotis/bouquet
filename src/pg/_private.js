require('dotenv').config();
const sql = require('pg-sql2');
const url = require('url');

const valueSafeForSet = value =>
    value == null // of undefined dus
        ? ''
        : typeof value === 'object'
        ? JSON.stringify(value)
        : value;

const getPgSettingsFromReq = (
    req,
    reqParts = ['headers', 'user', 'query', 'session'],
    getRole,
    defaultSettings = {}
) => {
    const settings = {
        role: typeof getRole === 'string' ? getRole : getRole(req),
        ...defaultSettings,
    };

    reqParts.forEach(part => {
        const value =
            part === 'fullUrl'
                ? url.format({
                      protocol: req.protocol,
                      host: req.get('host'),
                      pathname: req.originalUrl,
                  })
                : req[part];
        const valueType = typeof value;

        if (valueType === 'string' || valueType === 'boolean') {
            settings[`request.${part}`] = value;
            return;
        }

        Object.entries(value || {}).forEach(([key, value]) => {
            settings[
                `request.${part.replace('headers', 'header')}.${key}`
            ] = valueSafeForSet(value);
        });
    });

    return settings;
};

const getSettingsForPgClientTransaction = ({ pgSettings }) => {
    let role,
        localSettings = [];
    if (pgSettings && typeof pgSettings === 'object') {
        for (const key in pgSettings) {
            if (
                Object.prototype.hasOwnProperty.call(pgSettings, key)
                // && isPgSettingValid(pgSettings[key])
            ) {
                if (key === 'role') {
                    role = pgSettings[key];
                } else {
                    localSettings.push([key, pgSettings[key]]);
                }
            }
        }
    }

    return { role, localSettings };
};

// compiled from https://github.com/graphile/postgraphile/blob/51bd1dc96de194f75fdb1759e0ce9f555b2cf82b/src/postgraphile/withPostGraphileContext.ts
const getSqlSettingsQuery = localSettings => {
    const sqlSettings = [];
    if (!localSettings.length) return null;

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

    const sqlSettingsQuery =
        sqlSettings.length > 0
            ? sql.compile(sql.query`select ${sql.join(sqlSettings, ', ')}`)
            : null;

    return sqlSettingsQuery;
};

module.exports = {
    getSqlSettingsQuery,
    getPgSettingsFromReq,
    getSettingsForPgClientTransaction,
};
