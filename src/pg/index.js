const { valueSafeForSet } = require('./_private');
// Initialize the database connection only once, shared between modules.
// https://stackoverflow.com/questions/34382796/where-should-i-initialize-pg-promise
const initOptions = {
    // initialization options;
};

const pgp = require('pg-promise')(initOptions);
require('pg-monitor').attach(initOptions, [
    'connect',
    'disconnect',
    'error',
    'query',
]);

const toLocalsForPostgraphile = request => ({
    timezone: 'Europe/Amsterdam',
    ...Object.entries(request.headers || {}).reduce((acc, [key, value]) => {
        acc[
            pgp.as.format(`request.header.$<key:value>`, { key })
        ] = valueSafeForSet(value);
        return acc;
    }, {}),
    ...Object.entries(request.user || {}).reduce((acc, [key, value]) => {
        acc[
            pgp.as.format(`request.user.$<key:value>`, { key })
        ] = valueSafeForSet(value);
        return acc;
    }, {}),
    ...Object.entries(request.session || {}).reduce((acc, [key, value]) => {
        acc[
            pgp.as.format(`request.session.$<key:value>`, { key })
        ] = valueSafeForSet(value);
        return acc;
    }, {}),
});

module.exports = {
    pgp,
    toLocalsForPostgraphile,
};
