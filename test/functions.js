const tape = require('tape');

tape('functions', t => {
    const expected = {
        logger: {
            index: ['info', 'warn', 'error', 'debug'],
        },
        mssql: {
            mssql: [
                'connect',
                'query',
                'close',
                'all',
                'one',
                'tag',
                'cp',
                'mssql',
            ],
        },
        express: {
            utils: ['getRemoteAddress'],
            middleware: [
                'ensureAuthenticated',
                'ensureCsrfProtected',
                'ensureNocache',
                'ensureTraceProtected',
            ],
            session: ['session', 'getRedisStore'],
            setup: [
                'setupErrorHandling',
                'setupPostgraphile',
                'setupStartServer',
            ],
        },
        mailjet: {
            index: ['connect', 'send'],
        },
        pg: {
            index: [
                'getConnectionString',
                'connect',
                'getClient',
                'query',
                'queryAsRole',
                'queryWithContext',
                'sql',
            ],
        },
    };

    // iterate over submodules
    Object.entries(expected).forEach(([submodule, value]) => {
        const actualFns = Object.keys(require(`../src/${submodule}`));

        // iterate over expected files/folders in submodules
        Object.entries(value).forEach(([folder, arr]) => {
            // iterate over its expected functions
            arr.forEach(expectedFnName => {
                const foundIndex = actualFns.indexOf(expectedFnName);
                t.ok(
                    foundIndex > -1,
                    `bouquet/${submodule} exports function "${expectedFnName}" (in ${folder})`
                );
                actualFns.splice(foundIndex, 1);
            });
        });

        t.equal(
            actualFns.length,
            0,
            `bouquet/${submodule} also exports these unexpected functions: ${actualFns.join(
                ', '
            )}`
        );
    });

    t.end();
});
