const tape = require('tape');

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
        pg: {
            index: ['pgp', 'toLocalsForPostgraphile'],
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
