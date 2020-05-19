const createError = require('http-errors');
const csrf = require('csurf');

const csrfProtection = csrf({ ignoreMethods: ['HEAD', 'OPTIONS'] });
const { NODE_ENV, WITH_STATIC } = process.env;
const withProtection = NODE_ENV === 'production' || !!WITH_STATIC;

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        next(createError(401, 'server.401'));
    }
};

const ensureCsrfProtected = (req, res, next) => {
    if (withProtection) {
        csrfProtection(req, res, next);
    } else {
        next();
    }
};

const ensureNocache = (req, res, next) => {
    // zoals https://github.com/helmetjs/nocache
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};

const ensureTraceProtected = (req, res, next) => {
    if (withProtection && req.method === 'TRACE') {
        return next(createError(405, 'server.405'));
    }
    next();
};

module.exports = {
    ensureAuthenticated,
    ensureCsrfProtected,
    ensureNocache,
    ensureTraceProtected,
};
