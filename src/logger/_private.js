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
                ip: getRemoteAddress(obj),
                method: obj.method,
                originalUrl: obj.originalUrl,
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

module.exports = { getInfoOfObject, makeErrorArguments };
