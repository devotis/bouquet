# 💐 Bouquet

A bouquet of little functions, wrappers and libraries that I use across projects and clients

## Install

`yarn add @devotis/bouquet` (or npm)

## Usage

### mssql

Functions to connect to and query SQL Server using [node-mssql](https://github.com/tediousjs/node-mssql) as a dependency.

```javascript
const {
    connect,
    query,
    close,
    all,
    one,
    tag,
    cp, // the connection pool for raw usage with for example:
    mssql, // const request = new mssql.Request(cp);
} = require('@devotis/bouquet/mssql');
```

### express

Functions and middleware to be used with Express.

```javascript
const {
    getRemoteAddress,
    ensureAuthenticated,
    ensureCsrfProtected,
    ensureTraceProtected,
    setupStartServer,
    setupErrorHandling,
} = require('@devotis/bouquet/express');
```

### logger

All same as the logfmt based [heroku-logger](https://github.com/ianstormtaylor/heroku-logger), but allows logging an error object along with context-specific error message ([issues](https://github.com/ianstormtaylor/heroku-logger/issues/15)) and the express req object

```javascript
const logger = require('@devotis/bouquet/logger');

const error = new Error('x');

logger.error(error);
logger.error(error, { some, additional, info });
logger.error(error, req); // req is the express req object.
logger.error('Custom error message', error);
logger.error('Custom error message', error, { some, additional, info });
logger.error('Custom error message', error, req);
```
