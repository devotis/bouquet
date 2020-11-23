const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const logger = require('../logger');

const makeLogger = (type) => (arg0) => {
    if (arg0 instanceof Error) {
        logger.error(`bouquet/express > redis ${type}`, arg0);
    } else {
        logger.info(`bouquet/express > redis ${type}`);
    }
};

const retry_strategy = (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
};

const getRedisStore = (options = {}) => {
    const client = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy,
        ...options,
    });
    client.unref();

    client.on('connect', makeLogger('connect'));
    client.on('ready', makeLogger('ready'));
    client.on('reconnecting', makeLogger('reconnecting'));
    client.on('error', makeLogger('error'));
    client.on('end', makeLogger('end'));

    const redisStore = new RedisStore({ client });

    return redisStore;
};

module.exports = { session, getRedisStore };
