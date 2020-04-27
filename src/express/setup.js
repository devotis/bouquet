const createError = require('http-errors');
const listEndpoints = require('express-list-endpoints');
const logger = require('../logger');
const { getPgSettingsFromReq } = require('../pg/_private');

const { DATABASE_URL, NODE_ENV, PORT } = process.env;

const isDevelopment = NODE_ENV !== 'production';
const port = PORT || 5000;

const errorHandling = server => {
    logger.info('bouquet/express > setup error handling');

    // catch 404 and forward to error handler
    server.use((req, res, next) => {
        next(createError(404));
    });
    // eslint-disable-next-line no-unused-vars
    server.use((err, req, res, next) => {
        const status = err.status || 500;
        logger.error('bouquet/express > request error', err, req);

        res.status(status);
        res.json({
            error: {
                message:
                    err.code === 'EBADCSRFTOKEN'
                        ? 'server.security.invalid-csrf-token'
                        : err.message,
                code: err.code,
                stack: isDevelopment ? err.stack : undefined,
            },
            req: {
                method: req.method,
                headers: req.headers,
                body: req.body,
            },
            res: {
                status,
            },
        });
    });
};

const postgraphile = (
    server,
    // config with defaults
    {
        schemaName = 'app',
        mountPath = '/api/postgraphile',
        application_name = 'bouquet',
        getRole = req => `app_${req.user ? req.user.role : 'anonymous'}`,
    } = {}
) => {
    server.use(
        mountPath,
        postgraphile(`${DATABASE_URL}?ssl=true`, schemaName, {
            dynamicJson: true,
            showErrorStack: isDevelopment,
            watchPg: isDevelopment,
            graphiql: isDevelopment,
            enhanceGraphiql: isDevelopment,
            appendPlugins: [
                require('@graphile-contrib/pg-simplify-inflector'),
                require('postgraphile-plugin-connection-filter'),
            ],
            extendedErrors: isDevelopment
                ? [
                      'severity',
                      'code',
                      'detail',
                      'hint',
                      'position',
                      'internalPosition',
                      'internalQuery',
                      'where',
                      'schema',
                      'table',
                      'column',
                      'dataType',
                      'constraint',
                      'file',
                      'line',
                      'routine',
                  ]
                : ['hint', 'detail', 'errcode'],
            // You just need to generate JWT tokens for your users...,
            // or use _pgSettings_ to indicate the current user.
            // https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
            pgSettings: req => {
                // pgDefaultRole zou ingesteld moeten zijn als app_anonymous
                // als geen pgSettings gebruikt zou worden

                // https://github.com/graphile/postgraphile/issues/499#issuecomment-413259134
                return getPgSettingsFromReq(
                    req,
                    ['headers', 'user', 'query', 'session'],
                    getRole,
                    { application_name }
                );
            },
        })
    );
};

const startServer = server => {
    logger.info('bouquet/express > starting server');

    server.listen(port, error => {
        if (error) {
            logger.error('bouquet/express > unable to start server', error);
        } else {
            logger.info('bouquet/express > started server', { port });
            console.log(listEndpoints(server));
        }
    });
};

module.exports = {
    setupErrorHandling: errorHandling,
    setupPostgraphile: postgraphile,
    setupStartServer: startServer,
};
