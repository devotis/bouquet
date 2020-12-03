# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.6] - 2020-12-03

### Fixed

-   Gigantic error logs for superagent response errors

## [1.3.5] - 2020-11-23

### Fixed

-   Tests for request.session.id

### Added

-   Add complete and working example for mssql

### Changed

-   Prettier 2.x

## [1.3.4] - 2020-06-02

### Added

-   Allow passing own keyset to mailjet connect

## [1.3.3] - 2020-05-19

### Added

-   Allow adding the req object to logger.info/warn/debug for additional info about the request

## [1.3.2] - 2020-05-19

### Added

-   ensureNocache middleware

## [1.3.1] - 2020-05-12

### Changed

-   Accept redis client options

## [1.3.0] - 2020-05-12

### Added

-   Wrapper for creating a redisStore fast with built in retry and logging

## [1.2.3] - 2020-05-11

### Added

-   Test that only the expected functions are exported and not more

### Fixed

-   request.session.id not available with 'session' as the req parts

## [1.2.2] - 2020-05-06

### Added

-   Allow also string parts of the request like originalUrl, method (and one bonus peroperty fullUrl) to be added to the pg settings

## [1.2.1] - 2020-05-06

### Changed

-   [Doc] show how you should actually require the submodules in readme

### Fixed

-   Error package subpath './v4' is not defined by "exports" in /.../node_modules/uuid/package.json

## [1.2.0] - 2020-04-24

### Added

-   Postgres support
-   Mssql pool error logging
-   Mssql log query duration
-   Mssql tests

## [1.1.1] - 2020-04-24

### Changed

-   More extensive express req object details in error log

## [1.1.0] - 2020-04-24

### Added

-   Mailjet submodule
-   Also export the connections pool and mssql directly
-   Test suite for the logger

### Changed

-   Refactor logger.error code
-   Use own logger internally

## [1.0.2] - 2020-04-22

### Added

-   Heroku-logger but with improved error function
-   Express middleware functions
-   Tests

### Changed

-   log format to: bouquet/[submodule] > message

### Fixed

-   Doc on usage

## [1.0.1] - 2020-04-21

### Added

-   New Express utility function

## [1.0.0] - 2020-04-21

### Added

-   New mssql function set
