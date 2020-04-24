const { getRemoteAddress } = require('../express/utils');

const getInfoOfObject = (obj = {}) => {
    if (obj instanceof Error) {
        // it is an Error instance
        return [
            'error',
            Object.getOwnPropertyNames(obj)
                .sort((a, b) =>
                    // sort `message` as first and `stack` as last one
                    a === 'stack'
                        ? 1
                        : b === 'stack'
                        ? -1
                        : a === 'message'
                        ? -1
                        : 0
                )
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
                ip: getRemoteAddress(),
                method: obj.method,
                originalUrl: obj.originalUrl,
                status,
            },
        ];
    } else if (Object.keys(obj).length) {
        // it is some other non-empty object
        return ['object', obj];
    }
    return ['empty'];
};

module.exports = getInfoOfObject;
