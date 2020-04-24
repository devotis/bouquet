const logger = require('heroku-logger');
const { makeErrorArguments } = require('./_private');

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

module.exports = {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error,
};
