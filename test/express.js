const tape = require('tape');

tape('express > session', async t => {
    const { getRedisStore } = require('../src/express/session');

    const redisStore = getRedisStore();

    t.ok(redisStore.client, 'redis store has a client');
    t.ok(redisStore.ttl, 'redis store has a ttl');
    t.ok(redisStore.prefix, 'redis store has a prefix');

    t.end();
});
