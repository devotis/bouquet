const tape = require('tape');
const httpMocks = require('node-mocks-http');
const uuidv4 = require('uuid/v4');
const querystring = require('querystring');

tape('logger > error', t => {
    const {
        getInfoOfObject,
        makeErrorArguments,
        sortMessageFirstAndStackLast,
    } = require('../src/logger/_private');
    const logger = require('../src/logger');

    const reqHeaders = {
        'x-request-id': uuidv4(),
        'x-forwarded-for': '1.1.1.1',
    };
    const url = 'https://example.com/user/42';
    const getRequest = httpMocks.createRequest({
        method: 'GET',
        url,
        params: {
            id: 42,
        },
        query: {
            a: 'qwe',
            c: 'rty',
        },
        headers: reqHeaders,
        options: { proto: 'https' },
    });
    const postRequest = httpMocks.createRequest({
        method: 'POST',
        url,
        params: {
            id: 42,
        },
        body: {
            a: 'qwe',
            c: 'rty',
        },
        headers: reqHeaders,
        options: { proto: 'https' },
    });
    const additionalInfo = {
        some: 1,
        additional: 2,
        info: 3,
    };
    const error = new Error('x');

    t.deepEqual(
        ['z', 'x', 'y', 'stack', 'message', 'a', 'b'].sort(
            sortMessageFirstAndStackLast
        ),
        ['message', 'z', 'x', 'y', 'a', 'b', 'stack'],
        'sortMessageFirstAndStackLast'
    );

    const info1 = getInfoOfObject(error, 'error');
    const info2 = getInfoOfObject(additionalInfo, 'error');
    const info3 = getInfoOfObject(getRequest, 'error');
    const args1 = makeErrorArguments(error);
    const args2 = makeErrorArguments(error, additionalInfo);
    const args3 = makeErrorArguments(error, getRequest); // getRequest is the express req object.
    const args4 = makeErrorArguments('Custom error message', error);
    const args5 = makeErrorArguments(
        'Custom error message',
        error,
        additionalInfo
    );
    const args6 = makeErrorArguments('Custom error message', error, getRequest);
    const args7 = makeErrorArguments(
        'Custom error message',
        error,
        postRequest
    );

    const expectedGetReqObject = {
        'request-id': reqHeaders['x-request-id'],
        ip: '1.1.1.1',
        ua: 'Other 0.0.0 / Other 0.0.0',
        method: 'GET',
        originalUrl: url,
        query: querystring.stringify(getRequest.query),
        body: null,
        headers: reqHeaders,
        csrf: getRequest.csrfToken ? getRequest.csrfToken() : undefined,
        auth: undefined,
        sessionID: undefined,
        protocol: undefined,
        host: undefined,
    };
    const expectedPostReqObject = {
        'request-id': reqHeaders['x-request-id'],
        ip: '1.1.1.1',
        ua: 'Other 0.0.0 / Other 0.0.0',
        method: 'POST',
        originalUrl: url,
        query: null,
        body: postRequest.body,
        headers: reqHeaders,
        csrf: postRequest.csrfToken ? postRequest.csrfToken() : undefined,
        auth: undefined,
        sessionID: undefined,
        protocol: undefined,
        host: undefined,
    };

    t.deepEqual(
        info1,
        ['error', { message: 'x', stack: error.stack }],
        'info1'
    );
    t.deepEqual(info2, ['info', { some: 1, additional: 2, info: 3 }], 'info2');
    t.deepEqual(info3, ['req', expectedGetReqObject], 'info3');

    t.deepEqual(args1, [error, {}], 'args1');
    t.deepEqual(args2, [error, { info: additionalInfo }], 'args2');
    t.deepEqual(
        args3,
        [
            error,
            {
                req: expectedGetReqObject,
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
                req: expectedGetReqObject,
            },
        ],
        'args6'
    );
    t.deepEqual(
        args7,
        [
            'Custom error message',
            {
                error: {
                    message: 'x',
                    stack: error.stack,
                },
                req: expectedPostReqObject,
            },
        ],
        'args7'
    );

    logger.error('Custom error message after get request', error, getRequest);
    logger.error('Custom error message after post request', error, postRequest);

    t.end();
});

tape('logger > others', t => {
    const {
        getInfoOfObject,
        makeOtherArguments,
    } = require('../src/logger/_private');
    const reqHeaders = {
        'x-request-id': uuidv4(),
        'x-forwarded-for': '1.1.1.1',
    };
    const url = 'https://example.com/user/42';
    const getRequest = httpMocks.createRequest({
        method: 'GET',
        url,
        params: {
            id: 42,
        },
        query: {
            a: 'qwe',
            c: 'rty',
        },
        headers: reqHeaders,
        options: { proto: 'https' },
    });

    let expectedGetReqObject;

    const info = getInfoOfObject(getRequest, 'info');
    const infoArgs = makeOtherArguments('some message', getRequest, 'info'); // getRequest is the express req object.

    // just a few bits of information when calling logger.info
    expectedGetReqObject = {
        'request-id': reqHeaders['x-request-id'],
        ip: '1.1.1.1',
        method: 'GET',
        originalUrl: url,
        auth: undefined,
    };
    t.deepEqual(info, ['req', expectedGetReqObject], 'info');
    t.deepEqual(infoArgs, ['some message', expectedGetReqObject], 'info args');

    const warn = getInfoOfObject(getRequest, 'warn');
    const warnArgs = makeOtherArguments('some message', getRequest, 'warn'); // getRequest is the express req object.
    const debug = getInfoOfObject(getRequest, 'debug');
    const debugArgs = makeOtherArguments('some message', getRequest, 'debug'); // getRequest is the express req object.

    // a lot more with when calling debug/warn
    expectedGetReqObject = {
        'request-id': reqHeaders['x-request-id'],
        ip: '1.1.1.1',
        ua: 'Other 0.0.0 / Other 0.0.0',
        method: 'GET',
        originalUrl: url,
        query: querystring.stringify(getRequest.query),
        body: null,
        headers: reqHeaders,
        csrf: getRequest.csrfToken ? getRequest.csrfToken() : undefined,
        auth: undefined,
        sessionID: undefined,
        protocol: undefined,
        host: undefined,
    };

    t.deepEqual(warn, ['req', expectedGetReqObject], 'warn');
    t.deepEqual(warnArgs, ['some message', expectedGetReqObject], 'warn args');
    t.deepEqual(debug, ['req', expectedGetReqObject], 'debug');
    t.deepEqual(
        debugArgs,
        ['some message', expectedGetReqObject],
        'debug args'
    );

    t.end();
});
