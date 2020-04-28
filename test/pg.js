const tape = require('tape');
const httpMocks = require('node-mocks-http');
const uuidv4 = require('uuid/v4');

const getRole = req => `app_${req.user ? req.user.roleName : 'anonymous'}`;

tape('logger', async t => {
    const {
        getSettingsFromRequest,
        getSqlSettingsQuery,
    } = require('../src/pg/_private');
    const {
        connect,
        query,
        getClient,
        queryWithContext,
    } = require('../src/pg');

    const reqHeaders = {
        'x-request-id': uuidv4(),
        'x-forwarded-for': '1.1.1.1',
    };
    const url = 'https://example.com/user/42';
    const q = {
        string: 'simple',
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
        'SELECT current_user',
        ...Object.keys(q).map(
            key =>
                `, current_setting('request.query.${key.replace(
                    /'/g,
                    "''"
                )}', true) as "${key}"`
        ),
    ].join('\n');

    connect();

    const result = await queryWithContext(
        getRequest,
        ['headers', 'user', 'query', 'session'],
        getRole,
        {},
        sql
    );

    t.deepEqual(result.rows, [
        {
            current_user: 'app_anonymous',
            string: 'simple',
            zero: '0',
            number: '1',
            bool: 'true',
            bool2: 'false',
            obj: '{"x":"123"}',
            emptyobj: '{}',
            arr: '[1,2,3]',
            emptyarr: '[]',
            nul: '',
            undef: '',
            "inje'ction": "Isn't injected",
        },
    ]);

    t.end();
});
