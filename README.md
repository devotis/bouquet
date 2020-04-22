# 💐 Bouquet

A bouquet of little functions, wrappers and libraries that I use across projects and clients

## Install

`yarn add @devotis/bouquet` (or npm)

## Usage

### mssql

Functions to connect to and query SQL Server using node-mssql as a dependency.

```javascript
const {
    connect,
    query,
    close,
    all,
    one,
    tag,
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

All same as the logfmt based [heroku-logger](https://github.com/ianstormtaylor/heroku-logger), but allows logging an error object along with context-specific error message ([issues](https://github.com/ianstormtaylor/heroku-logger/issues/15))

```javascript
const logger = require('@devotis/bouquet/logger');

logger.error('Custom message', error, req);
//
```
