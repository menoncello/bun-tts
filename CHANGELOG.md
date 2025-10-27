# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with TypeScript configuration
- CLI framework with help system and version command
- Error handling framework with structured logging
- Configuration management system
- Testing framework setup with Bun Test
- Dependency Injection system with Awilix
- StrykerJS mutation testing configuration
- ESLint and Prettier code formatting configuration

### Fixed
- DataCloneError in test environment by fixing Pino logger configuration
- All 14 failing tests now pass (207 pass, 0 fail)

## [0.1.0] - 2025-10-26

### Added
- Complete project infrastructure foundation
- Basic CLI entry point with help system
- Version command with build information
- Error handling with custom BunTtsError classes
- Result pattern for functional error propagation
- Structured logging with Pino
- Configuration management with Cosmiconfig
- Dependency Injection container setup
- Comprehensive testing framework
- Code quality tools (ESLint, Prettier, StrykerJS)

### Features
- Cross-platform CLI binary distribution
- Modular architecture with dependency injection
- Comprehensive error recovery system
- Professional development environment setup

### Technical Details
- Built with Bun runtime for optimal performance
- TypeScript with strict type checking
- React-based CLI interface using Ink
- Professional logging and error handling
- 95%+ test coverage with mutation testing