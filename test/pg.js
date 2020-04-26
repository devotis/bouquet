const tape = require('tape');
const httpMocks = require('node-mocks-http');
const uuidv4 = require('uuid/v4');

const getRole = req => `app_${req.user ? req.user.roleName : 'anonymous'}`;

tape('logger', async t => {
    const {
        getSettingsFromRequest,
        getSqlSettingsQuery,
    } = require('../src/pg/_private');
    const { query, getClient, queryWithContext } = require('../src/pg');

    const reqHeaders = {
        'x-request-id': uuidv4(),
        'x-forwarded-for': '1.1.1.1',
    };
    const url = 'https://example.com/user/42';
    const q = {
        string: 'simple',
        datum: new Date(),
        zero: 0,
        number: 1,
        bool: true,
        bool2: false,
        obj: { x: '123' },
        emptyobj: {},
        arr: [1, 2, 3],
        emptyarr: [],
        nul: null,
        undef: undefined,
        "inje'ction": "Isn't injected",
    };
    const getRequest = httpMocks.createRequest({
        method: 'GET',
        url,
        params: {
            id: 42,
        },
        query: q,
        headers: reqHeaders,
        options: { proto: 'https' },
    });

    const sql = [
        'SELECT now() as "now"',
        ...Object.keys(q).map(
            key =>
                `, current_setting('request.query.${key.replace(
                    /'/g,
                    "''"
                )}', true) as "${key}"`
        ),
    ].join('\n');

    const result = await queryWithContext(getRequest, getRole, sql);

    // const settings = getSettingsFromRequest(
    //     getRequest,
    //     ['headers', 'query', 'body', 'session'],
    //     { timezone: 'Europe/Amsterdam' }
    // );
    //
    // console.log(settings);
    //
    // const sqlSettingsQuery = getSqlSettingsQuery(settings);
    //
    // console.log(sqlSettingsQuery);
    //
    // const result = await query('SELECT now() as nu', []);
    //
    // const [pgClient, release] = await getClient();
    // await pgClient.query('begin');
    //
    // try {
    //     // If there is at least one local setting, load it into the database.
    //     await pgClient.query(sqlSettingsQuery);
    //
    //     const result = await pgClient.query(
    //         `SELECT now() as nu, current_setting('request.header.x-request-id') as nu2`
    //     );
    //     console.log(result);
    // } catch (err) {
    //     console.error();
    // } finally {
    //     // Cleanup our Postgres client by ending the transaction and releasing
    //     // the client back to the pool. Always do this even if the query fails.
    //     try {
    //         await pgClient.query('commit');
    //     } finally {
    //         release();
    //     }
    // }

    console.log(result.rows);

    t.end();
});
