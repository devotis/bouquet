const pg = require('pg');
const tape = require('tape');
const httpMocks = require('node-mocks-http');

const getRole = req => `app_${req.user ? req.user.roleName : 'anonymous'}`;

const getRequest = () => {
    const requestId = '9357880a-3d7f-49f0-8232-30f4426e9913';
    const headers = {
        'x-request-id': requestId,
        'x-forwarded-for': '1.1.1.1',
    };
    const url = 'https://example.com/user/42';
    const query = {
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
    const req = httpMocks.createRequest({
        method: 'GET',
        url,
        params: {
            id: 42,
        },
        query,
        headers: headers,
        options: { proto: 'https' },
    });

    return { headers, query, req, requestId };
};

tape('pg > unit', async t => {
    const {
        getSqlSettingsQuery,
        getPgSettingsFromReq,
        getSettingsForPgClientTransaction,
    } = require('../src/pg/_private');

    const { req, requestId } = getRequest();

    // Make an object with settings
    const pgSettings = getPgSettingsFromReq(req, undefined, getRole, undefined);

    // convert it to a role and localSettings that is an array of key-value arrays
    const { role: pgRole, localSettings } = getSettingsForPgClientTransaction({
        pgSettings,
    });

    // convert that to a query for postgres that set_config's
    const sqlSettingsQuery = getSqlSettingsQuery(localSettings);

    t.deepEqual(
        pgSettings,
        {
            role: 'app_anonymous',
            'request.header.x-request-id': requestId,
            'request.header.x-forwarded-for': '1.1.1.1',
            'request.query.string': 'simple',
            'request.query.zero': 0,
            'request.query.number': 1,
            'request.query.bool': true,
            'request.query.bool2': false,
            'request.query.obj': '{"x":"123"}',
            'request.query.emptyobj': '{}',
            'request.query.arr': '[1,2,3]',
            'request.query.emptyarr': '[]',
            'request.query.nul': '',
            'request.query.undef': '',
            "request.query.inje'ction": "Isn't injected",
        },
        'getPgSettingsFromReq > converts a express req object to an object that could be fed as pgSettings to postgraphile'
    );

    t.equal(
        pgRole,
        'app_anonymous',
        'getSettingsForPgClientTransaction > gets the role'
    );
    t.deepEqual(
        localSettings,
        [
            ['request.header.x-request-id', requestId],
            ['request.header.x-forwarded-for', '1.1.1.1'],
            ['request.query.string', 'simple'],
            ['request.query.zero', 0],
            ['request.query.number', 1],
            ['request.query.bool', true],
            ['request.query.bool2', false],
            ['request.query.obj', '{"x":"123"}'],
            ['request.query.emptyobj', '{}'],
            ['request.query.arr', '[1,2,3]'],
            ['request.query.emptyarr', '[]'],
            ['request.query.nul', ''],
            ['request.query.undef', ''],
            ["request.query.inje'ction", "Isn't injected"],
        ],
        'getSettingsForPgClientTransaction > also converts the pgSettings object to an an array of key-value arrays'
    );

    t.equal(
        sqlSettingsQuery.text,
        'select set_config($1, $2, true), set_config($3, $4, true), set_config($5, $6, true), set_config($7, $8, true), set_config($9, $10, true), set_config($11, $12, true), set_config($13, $14, true), set_config($15, $16, true), set_config($17, $18, true), set_config($19, $20, true), set_config($21, $22, true), set_config($23, $24, true), set_config($25, $26, true), set_config($27, $28, true)',
        'sqlSettingsQuery > creates a parameterized query'
    );
    t.deepEqual(
        sqlSettingsQuery.values,
        [
            'request.header.x-request-id',
            requestId,
            'request.header.x-forwarded-for',
            '1.1.1.1',
            'request.query.string',
            'simple',
            'request.query.zero',
            0,
            'request.query.number',
            1,
            'request.query.bool',
            true,
            'request.query.bool2',
            false,
            'request.query.obj',
            '{"x":"123"}',
            'request.query.emptyobj',
            '{}',
            'request.query.arr',
            '[1,2,3]',
            'request.query.emptyarr',
            '[]',
            'request.query.nul',
            '',
            'request.query.undef',
            '',
            "request.query.inje'ction",
            "Isn't injected",
        ],
        'sqlSettingsQuery > with the parameters'
    );

    t.end();
});

tape('pg > integration', async t => {
    const { sql, connect, queryWithContext } = require('../src/pg');
    const escape = pg.Client.prototype.escapeIdentifier;

    const { req, query: reqQuery } = getRequest();

    const query = sql`SELECT current_user`;

    Object.keys(reqQuery).forEach(key => {
        query
            .append(sql`, current_setting(${'request.query.' + key}, true) as `)
            .append(escape(key));
    });

    connect();

    const result = await queryWithContext(
        req,
        ['headers', 'user', 'query', 'session'],
        getRole,
        {},
        query
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
