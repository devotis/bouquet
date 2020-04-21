# 💐 Bouquet

A bouquet of little functions, wrappers and libraries that I use across projects and clients

## Install

`yarn add @devotis/bouquet` (or npm)

## Usage

### mssql

Functions to connect to and query SQL Server using node-mssql as a dependency.

```javascript
const { connect, query, close, all, one, tag } = require('@devotis/bouquet/mssql');
```

### express

Functions to be used in conjunction with Express.

```javascript
const { getRemoteAddress } = require('@devotis/bouquet/express');
```
