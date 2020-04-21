const logger = require('heroku-logger');
const createError = require('http-errors');
const listEndpoints = require('express-list-endpoints');

const isDevelopment = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 5000;

const errorHandling = server => {
    logger.info('bouquet - express - setup error handling');

    // catch 404 and forward to error handler
    server.use((req, res, next) => {
        next(createError(404));
    });
    // eslint-disable-next-line no-unused-vars
    server.use((err, req, res, next) => {
        const status = err.status || 500;
        logger.error('bouquet - express - request error', err, req);

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

const startServer = server => {
    logger.info('bouquet - express - starting server');

    server.listen(port, error => {
        if (error) {
            logger.error('bouquet - express - unable to start server', error);
        } else {
            logger.info('bouquet - express - started server', { port });
            console.log(listEndpoints(server));
        }
    });
};

module.exports = {
    errorHandling,
    startServer,
};
