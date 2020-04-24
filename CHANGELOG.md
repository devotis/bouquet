# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
