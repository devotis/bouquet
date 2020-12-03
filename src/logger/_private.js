const useragent = require('useragent');
const querystring = require('querystring');
const { getRemoteAddress } = require('../express/utils');

const sortMessageFirstAndStackLast = (a, b) =>
    // sort `message` as first and `stack` as last one
    a === 'stack' ? 1 : b === 'stack' ? -1 : a === 'message' ? -1 : 0;

const getInfoOfObject = (obj = {}, level) => {
    if (obj instanceof Error) {
        // it is an Error instance
        return [
            'error',
            Object.getOwnPropertyNames(obj)
                .sort(sortMessageFirstAndStackLast)
                .reduce((acc, name) => {
                    if (name === 'response') {
                        const res = obj[name];
                        acc.response = {
                            type: res.type,
                            charset: res.charset,
                            content: res.body || res.text,
                        };
                    } else {
                        // may contain message and stack
                        // but also code, hint, details (pg)
                        // or originalError, precedingErrors, etc (mssql)
                        acc[name] = obj[name];
                    }
                    return acc;
                }, {}),
        ];
    }
    if (obj.originalUrl) {
        // it is an Express request object
        if (level === 'info') {
            // return just a few parts of the req object
            return [
                'req',
                {
                    'request-id': obj.headers['x-request-id'], // https://brandur.org/request-ids
                    ip: getRemoteAddress(obj),
                    method: obj.method,
                    originalUrl: obj.originalUrl,
                    auth: obj.isAuthenticated && obj.isAuthenticated(),
                },
            ];
        }
        // return a lot of req parts for debugging
        return [
            'req',
            {
                'request-id': obj.headers['x-request-id'], // https://brandur.org/request-ids
                ip: getRemoteAddress(obj),
                ua: useragent.parse(obj.headers['user-agent']).toString(),
                method: obj.method,
                originalUrl: obj.originalUrl,
                query:
                    obj.query && Object.keys(obj.query).length
                        ? querystring.stringify(obj.query)
                        : null,
                body:
                    obj.body && Object.keys(obj.body).length ? obj.body : null,
                headers: obj.headers,
                csrf: obj.csrfToken ? obj.csrfToken() : undefined,
                auth: obj.isAuthenticated && obj.isAuthenticated(),
                sessionID: obj.sessionID,
                protocol: obj.protocol,
                host: obj.get('host'),
            },
        ];
    } else if (Object.keys(obj).length) {
        // it is some other non-empty object
        return ['info', obj];
    }
    return ['empty'];
};

const makeErrorArguments = (one, two = {}, three = {}) => {
    // convert Error instance to object
    const [twoType, twoInfo] = getInfoOfObject(two, 'error');
    const [threeType, threeInfo] = getInfoOfObject(three, 'error');

    // Add info only when it's there
    const allInfo = {};

    if (twoType !== 'empty') {
        allInfo[twoType] = twoInfo;
    }
    if (threeType !== 'empty') {
        allInfo[threeType] = threeInfo;
    }

    return [
        one, // a string message or Error instance
        allInfo,
    ];
};

const makeOtherArguments = (one, two, level) => {
    // convert Error instance to object
    const [, twoInfo] = getInfoOfObject(two, level);

    return [one, twoInfo];
};

module.exports = {
    sortMessageFirstAndStackLast,
    getInfoOfObject,
    makeErrorArguments,
    makeOtherArguments,
};
