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
} = require('@devotis/bouquet').mssql;
```

### pg

Functions to execute queries as a role and local settings from the Express request object.

#### With postgraphile as middleware

```javascript
const express = require('express');
const {
    connect,
    setupPostgraphile,
    errorHandling,
    startServer,
} = require('@devotis/bouquet').express;

const server = express();
const poolPg = connect();

// ...
setupPostgraphile(server, {
    pool: poolPg,
    schemaName: 'app',
    mountPath: '/api/postgraphile',
    reqParts = ['headers', 'user', 'query', 'session'],
    getRole: req => `app_${req.user ? req.user.roleName : 'anonymous'}`,
    defaultSettings: {
        application_name: 'bouquet',
        timezone: 'Europe/Amsterdam',
    },
});
// ...
setupErrorHandling(server);
setupStartServer(server);
```

#### Without postgraphile

You can query as a role with local settings without postgraphile as well.

```javascript
const express = require('express');
const { sql, queryWithContext } = require('@devotis/bouquet').pg;

// ...
const routeHandler = async (req, res, next) => {
    const result = await queryWithContext(
        req,
        ['headers', 'user', 'query', 'session'],
        req => `app_${req.user ? req.user.roleName : 'anonymous'}`,
        {
            application_name: 'bouquet',
            timezone: 'Europe/Amsterdam',
        },
        sql`
            select t.*
            from app.my_table t
            where t.id = ${req.params.id}
              and t.creator_id = current_setting('request.user.id', true)
        `
    );

    res.json(result);
};
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
} = require('@devotis/bouquet').express;
```

### logger

All same as the logfmt based [heroku-logger](https://github.com/ianstormtaylor/heroku-logger), but allows logging an error object along with context-specific error message ([issues](https://github.com/ianstormtaylor/heroku-logger/issues/15)) and the express req object

```javascript
const logger = require('@devotis/bouquet').logger;

const error = new Error('x');

logger.error(error);
logger.error(error, { some, additional, info });
logger.error(error, req); // req is the express req object.
logger.error('Custom error message', error);
logger.error('Custom error message', error, { some, additional, info });
logger.error('Custom error message', error, req);
```

### mailjet

```javascript
const { connect, send } = require('@devotis/bouquet').mailjet;

connect();

await sendJetEmail({
    to: 'someone@example.com',,
    // bcc,
    data: { some data },
    TemplateID: <Mailjet Template ID number>,
});
```
