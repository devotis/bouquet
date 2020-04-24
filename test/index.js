const tape = require('tape');
var httpMocks = require('node-mocks-http');
const uuidv4 = require('uuid/v4');

tape('logger', t => {
    const {
        getInfoOfObject,
        makeErrorArguments,
    } = require('../src/logger/_private');

    const reqHeaders = {
        'x-request-id': uuidv4(),
        'x-forwarded-for': '1.1.1.1',
    };
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/user/42',
        params: {
            id: 42,
        },
        headers: reqHeaders,
    });
    const additionalInfo = {
        some: 1,
        additional: 2,
        info: 3,
    };
    const error = new Error('x');

    const info1 = getInfoOfObject(error);
    const info2 = getInfoOfObject(additionalInfo);
    const info3 = getInfoOfObject(req);
    const args1 = makeErrorArguments(error);
    const args2 = makeErrorArguments(error, additionalInfo);
    const args3 = makeErrorArguments(error, req); // req is the express req object.
    const args4 = makeErrorArguments('Custom error message', error);
    const args5 = makeErrorArguments(
        'Custom error message',
        error,
        additionalInfo
    );
    const args6 = makeErrorArguments('Custom error message', error, req);

    const expectedReqObject = {
        'request-id': reqHeaders['x-request-id'],
        ip: '1.1.1.1',
        method: 'GET',
        originalUrl: '/user/42',
    };

    t.deepEqual(
        info1,
        ['error', { message: 'x', stack: error.stack }],
        'info1'
    );
    t.deepEqual(info2, ['info', { some: 1, additional: 2, info: 3 }], 'info2');
    t.deepEqual(info3, ['req', expectedReqObject], 'info3');

    t.deepEqual(args1, [error, {}], 'args1');
    t.deepEqual(args2, [error, { info: additionalInfo }], 'args2');
    t.deepEqual(
        args3,
        [
            error,
            {
                req: expectedReqObject,
            },
        ],
        'args3'
    );
    t.deepEqual(
        args4,
        [
            'Custom error message',
            { error: { message: 'x', stack: error.stack } },
        ],
        'args4'
    );
    t.deepEqual(
        args5,
        [
            'Custom error message',
            {
                error: {
                    message: 'x',
                    stack: error.stack,
                },
                info: { some: 1, additional: 2, info: 3 },
            },
        ],
        'args5'
    );
    t.deepEqual(
        args6,
        [
            'Custom error message',
            {
                error: {
                    message: 'x',
                    stack: error.stack,
                },
                req: expectedReqObject,
            },
        ],
        'args6'
    );

    t.end();
});

tape('functions', t => {
    const expected = {
        logger: {
            index: ['info', 'warn', 'error', 'debug'],
        },
        mssql: {
            mssql: ['connect', 'query', 'close', 'all', 'one', 'tag'],
        },
        express: {
            utils: ['getRemoteAddress'],
            middleware: [
                'ensureAuthenticated',
                'ensureCsrfProtected',
                'ensureTraceProtected',
            ],
            setup: ['setupErrorHandling', 'setupStartServer'],
        },
        mailjet: {
            index: ['connect', 'send'],
        },
    };

    // iterate over submodules
    Object.entries(expected).forEach(([submodule, value]) => {
        const actualFns = Object.keys(require(`../src/${submodule}`));
        // iterate over expected files/folders in submodules
        Object.entries(value).forEach(([folder, arr]) => {
            // iterate over its expected functions
            arr.forEach(expectedFnName => {
                t.ok(
                    actualFns.includes(expectedFnName),
                    `bouquet/${submodule} exports function "${expectedFnName}" (in ${folder})`
                );
            });
        });
    });

    t.end();
});
