const tape = require('tape');

tape('logger', t => {
    const logger = require('../src/logger');

    t.doesNotThrow(
        () => {
            logger.info(1);
            logger.error('Custom message');
            logger.error('Custom message', new Error('x'));
            logger.error(new Error('x'));
        },
        undefined,
        'logger functions can be called'
    );

    t.end();
});

tape('functions', t => {
    const expected = {
        logger: {
            index: ['info', 'warn', 'error', 'debug'],
        },
        mssql: {
            mssql: ['connect', 'query', 'close', 'all', 'one', 'tag'],
        },
        express: {
            utils: ['getRemoteAddress'],
            middleware: [
                'ensureAuthenticated',
                'ensureCsrfProtected',
                'ensureTraceProtected',
            ],
            setup: ['setupErrorHandling', 'setupStartServer'],
        },
        mailjet: {
            index: ['connect', 'send'],
        },
    };

    // iterate over submodules
    Object.entries(expected).forEach(([submodule, value]) => {
        const actualFns = Object.keys(require(`../src/${submodule}`));
        // iterate over expected files/folders in submodules
        Object.entries(value).forEach(([folder, arr]) => {
            // iterate over its expected functions
            arr.forEach(expectedFnName => {
                t.ok(
                    actualFns.includes(expectedFnName),
                    `bouquet/${submodule} exports function "${expectedFnName}" (in ${folder})`
                );
            });
        });
    });

    t.end();
});
