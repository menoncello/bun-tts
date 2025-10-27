#!/usr/bin/env node

/**
 * Main CLI entry point for bun-tts application
 *
 * This file serves as the primary entry point for the bun-tts CLI tool.
 * It handles command-line argument parsing, command routing, and initialization
 * of the application context.
 *
 * @fileoverview CLI application entry point with command routing and error handling
 * @author Eduardo Menoncello
 * @version 0.1.0
 */

import { render } from 'ink';
import meow from 'meow';
import React from 'react';
import type { CliContext, CliFlags } from '../types/index.js';
import { App } from '../ui/app.js';
import { debugManager } from '../utils/debug.js';
import { errorReporter } from '../utils/error-reporter.js';
import { getCommand } from './commands/index.js';

/**
 * Application version information
 */
const APP_VERSION = '0.1.0';

/**
 * Available CLI commands
 */
const AVAILABLE_COMMANDS = ['help', 'version', 'convert', 'config'] as const;

/**
 * CLI configuration using meow library
 */
const cli = meow(
  `
  bun-tts - Professional Audiobook Creation Tool

  Usage:
    bun-tts [command] [options]
    bun-tts [file] [options]

  Commands:
    help       Show help message and usage information
    version    Show version information
    convert    Convert a document to audiobook format
    config     Manage configuration settings

  Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose logging
    -c, --config    Path to configuration file

  Examples:
    bun-tts help                    Show help message
    bun-tts version                 Show version information
    bun-tts convert book.pdf        Convert PDF to audiobook
    bun-tts --verbose convert       Convert with verbose logging
    bun-tts --config cfg.json file  Use custom configuration
  `,
  {
    importMeta: import.meta,
    flags: {
      config: {
        type: 'string',
        shortFlag: 'c',
      },
      verbose: {
        type: 'boolean',
        shortFlag: 'v',
      },
      help: {
        type: 'boolean',
        shortFlag: 'h',
      },
      version: {
        type: 'boolean',
      },
    },
    autoVersion: false,
    autoHelp: false,
  }
);

/**
 * Creates and returns version information string
 *
 * @returns {string} Formatted version information including build details
 */
function createVersionText(): string {
  return `bun-tts version ${APP_VERSION}

Build Information:
  Node.js: ${process.version}
  Platform: ${process.platform}
  Architecture: ${process.arch}
  Built: ${new Date().toISOString()}`;
}

/**
 * Handles version flag display and exits
 */
function handleVersionFlag(): void {
  const versionText = createVersionText();
  console.log(versionText);
  process.exit(0);
}

/**
 * Handles help flag display and exits
 */
async function handleHelpFlag(): Promise<void> {
  const helpCommand = getCommand('help');
  if (helpCommand) {
    const context: CliContext = {
      flags: cli.flags as CliFlags,
      input: cli.input,
      logLevel: 'info',
    };
    await helpCommand.handler(context);
  }
  process.exit(0);
}

/**
 * Initializes error reporting and debugging systems
 */
function initializeErrorHandling(): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  errorReporter().setEnvironment(isDevelopment ? 'development' : 'production');
}

/**
 * Creates CLI context from parsed flags and input
 *
 * @returns {CliContext} The application context with flags, input, and log level
 */
function createCliContext(): CliContext {
  return {
    flags: cli.flags as CliFlags,
    input: cli.input,
    logLevel: cli.flags.verbose ? 'debug' : 'info',
  };
}

/**
 * Logs CLI startup information for debugging
 *
 * @param {CliContext} context - The CLI context to log
 */
function logCliStartup(context: CliContext): void {
  debugManager().info('CLI started', {
    flags: cli.flags,
    input: cli.input,
    logLevel: context.logLevel,
    platform: process.platform,
    nodeVersion: process.version,
  });
}

/**
 * Checks if a command name is valid
 *
 * @param {string} commandName - The command name to validate
 * @returns {boolean} True if the command is valid, false otherwise
 */
function isValidCommand(commandName: string): boolean {
  return AVAILABLE_COMMANDS.includes(commandName.toLowerCase() as typeof AVAILABLE_COMMANDS[number]);
}

/**
 * Handles command execution with proper error handling
 *
 * @param {string} commandName - The name of the command to execute
 * @param {CliContext} context - The CLI context
 */
async function executeCommand(commandName: string, context: CliContext): Promise<void> {
  const command = getCommand(commandName);

  if (!command) {
    handleUnknownCommand(commandName);
    return;
  }

  debugManager().info(`Executing command: ${commandName}`, {
    command: command.name,
    description: command.description,
  });

  try {
    await command.handler(context);
    debugManager().info(`Command completed successfully: ${commandName}`);
    process.exit(0);
  } catch (error) {
    handleCommandError(error, commandName);
  }
}

/**
 * Handles unknown command errors
 *
 * @param {string} commandName - The unknown command name
 */
function handleUnknownCommand(commandName: string): void {
  const error = new Error(`Unknown command: ${commandName}`);
  errorReporter().reportError(error, {
    command: commandName,
    context: 'unknown_command',
    availableCommands: AVAILABLE_COMMANDS,
  });

  console.error(`Unknown command: ${commandName}`);
  console.log('Run "bun-tts help" to see available commands');
  process.exit(1);
}

/**
 * Handles command execution errors
 *
 * @param {unknown} error - The error that occurred
 * @param {string} commandName - The name of the command that failed
 */
function handleCommandError(error: unknown, commandName: string): void {
  errorReporter().reportError(error, {
    command: commandName,
    context: 'command_execution',
    flags: cli.flags,
  });

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Command failed: ${errorMessage}`);

  if (cli.flags.verbose) {
    const stackTrace = error instanceof Error ? error.stack : 'No stack available';
    console.error('Stack trace:', stackTrace);
  }

  process.exit(1);
}

/**
 * Starts the React UI for interactive mode
 *
 * @param {CliContext} context - The CLI context
 */
function startReactUI(context: CliContext): void {
  debugManager().debug('Starting React UI', {
    flags: cli.flags,
    input: cli.input,
  });

  try {
    render(<App flags={context.flags} input={context.input} />);
  } catch (error) {
    handleUIError(error);
  }
}

/**
 * Handles UI rendering errors
 *
 * @param {unknown} error - The error that occurred during UI rendering
 */
function handleUIError(error: unknown): void {
  errorReporter().reportError(error, {
    context: 'ui_rendering',
    flags: cli.flags,
    input: cli.input,
  });

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Failed to start UI:', errorMessage);

  if (cli.flags.verbose) {
    const stackTrace = error instanceof Error ? error.stack : 'No stack available';
    console.error('Stack trace:', stackTrace);
  }

  process.exit(1);
}

/**
 * Main application entry point
 *
 * Coordinates the initialization and execution flow of the CLI application.
 * Handles special flags (version, help), sets up error handling, creates
 * the execution context, and routes commands appropriately.
 */
async function main(): Promise<void> {
  // Handle special flags before logging
  if (cli.flags.version) {
    handleVersionFlag();
    return;
  }

  if (cli.flags.help) {
    await handleHelpFlag();
    return;
  }

  // Initialize systems
  initializeErrorHandling();
  const context = createCliContext();
  logCliStartup(context);

  // Handle command routing
  const commandName = cli.input[0];

  if (commandName && isValidCommand(commandName)) {
    await executeCommand(commandName, context);
  } else {
    // No valid command, use React UI
    startReactUI(context);
  }
}

// Start the application
main().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});