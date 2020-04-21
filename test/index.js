const tape = require('tape');
const logger = require('../src/logger');

tape('logger info', t => {
    logger.info(1);
    t.end();
});

tape('logger error', t => {
    logger.error('Custom message');
    logger.error('Custom message', new Error('x'));
    logger.error(new Error('x'));

    t.end();
});
