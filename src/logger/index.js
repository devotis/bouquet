const logger = require('heroku-logger');
const { makeErrorArguments, makeOtherArguments } = require('./_private');

// Log an error object along with context-specific error message #15
// https://github.com/ianstormtaylor/heroku-logger/issues/15
//
// Example calls
// logger.error(new Error(x));
// logger.error(new Error(x), {some, additional, info});
// logger.error(new Error(x), req);
// logger.error('Custom error message, new Error(x));
// logger.error('Custom error message, new Error(x), {some, additional, info});
// logger.error('Custom error message, new Error(x), req);
const error = (one, two = {}, three = {}) => {
    // convert Error instance to object
    const args = makeErrorArguments(one, two, three);

    return logger.error.apply(logger, args);
};

const debug = (one, two = {}) => {
    const args = makeOtherArguments(one, two, 'debug');

    return logger.debug.apply(logger, args);
};
const info = (one, two = {}) => {
    const args = makeOtherArguments(one, two, 'info');

    return logger.info.apply(logger, args);
};
const warn = (one, two = {}) => {
    const args = makeOtherArguments(one, two, 'warn');

    return logger.warn.apply(logger, args);
};

module.exports = {
    debug,
    info,
    warn,
    error,
};
