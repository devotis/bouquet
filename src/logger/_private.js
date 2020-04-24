const useragent = require('useragent');
const querystring = require('querystring');
const { getRemoteAddress } = require('../express/utils');

const sortMessageFirstAndStackLast = (a, b) =>
    // sort `message` as first and `stack` as last one
    a === 'stack' ? 1 : b === 'stack' ? -1 : a === 'message' ? -1 : 0;

const getInfoOfObject = (obj = {}) => {
    if (obj instanceof Error) {
        // it is an Error instance
        return [
            'error',
            Object.getOwnPropertyNames(obj)
                .sort(sortMessageFirstAndStackLast)
                .reduce((acc, name) => {
                    // may contain message and stack
                    // but also code, hint, details (pg)
                    // or originalError, precedingErrors, etc (mssql)
                    acc[name] = obj[name];
                    return acc;
                }, {}),
        ];
    }
    if (obj.originalUrl) {
        // it is an Express request object
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
    const [twoType, twoInfo] = getInfoOfObject(two);
    const [threeType, threeInfo] = getInfoOfObject(three);

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

module.exports = {
    sortMessageFirstAndStackLast,
    getInfoOfObject,
    makeErrorArguments,
};
