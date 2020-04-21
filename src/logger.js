const logger = require('heroku-logger');
const { getRemoteAddress } = require('./express/utils');

// Log an error object along with context-specific error message #15
// https://github.com/ianstormtaylor/heroku-logger/issues/15
const error = (messageOrError, errorOrAdditionalInfo = {}, req) => {
    // convert Error instance to object
    const errorInfoObject = Object.getOwnPropertyNames(errorOrAdditionalInfo)
        .sort(a => (a === 'stack' ? 1 : -1)) // stack as last one
        .reduce((acc, name) => {
            // may contain message and stack but also code, hint or details
            acc[name] = errorOrAdditionalInfo[name];
            return acc;
        }, {});

    // Get important items from the optional req object
    const requestInfoObject = req
        ? {
              'request-id': req.headers['x-request-id'],
              ip: getRemoteAddress(),
              method: req.method,
              originalUrl: req.originalUrl,
              status,
          }
        : undefined;

    // Add info only when it's there
    const allInfo = {};
    if (Object.keys(errorInfoObject).length) {
        allInfo.error = errorInfoObject;
    }
    if (requestInfoObject) {
        allInfo.req = requestInfoObject;
    }

    return logger.error.call(
        logger,
        messageOrError, // a string message or Error instance
        allInfo
    );
};

module.exports = {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error,
};
