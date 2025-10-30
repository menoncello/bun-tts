import { getAllCommands, formatCommandHelp } from './commands/index.js';

export interface HelpOptions {
  command?: string;
  verbose?: boolean;
}

/** Command name padding width for alignment in help output. */
const COMMAND_NAME_WIDTH = 10;

/**
 * Generates help documentation for bun-tts CLI tool.
 *
 * Provides comprehensive help information including usage examples, available commands,
 * configuration options, and environment variables. Can display help for a specific
 * command or general help for the entire CLI.
 *
 * @param {any} options - Configuration options for help generation
 * @param {string} [options.command] - Optional specific command to get help for
 * @param {boolean} [options.verbose] - Whether to include verbose debugging information
 * @returns {string} Formatted help documentation string
 */
export function generateHelp(options: HelpOptions = {}): string {
  const { command, verbose } = options;

  if (command) {
    return generateCommandSpecificHelp(command);
  }

  return generateGeneralHelp(verbose || false);
}

/**
 * Generates help information for a specific command.
 *
 * @param {any} command - The command name to get help for
 * @returns {string} Formatted command-specific help string
 */
function generateCommandSpecificHelp(command: string): string {
  const cmd = getAllCommands().find((c) => c.name === command.toLowerCase());
  if (cmd) {
    return formatCommandHelp(cmd);
  }
  return `Unknown command: ${command}\n\nRun 'bun-tts help' to see available commands.`;
}

/**
 * Generates general help information for the CLI tool.
 *
 * @param {any} verbose - Whether to include verbose debugging information
 * @returns {string} Formatted general help string
 */
function generateGeneralHelp(verbose: boolean): string {
  let help = getBasicHelpHeader();
  help += formatCommandsList();
  help += getGeneralHelpFooter();

  if (verbose) {
    help += getVerboseHelpSection();
  }

  return help;
}

/**
 * Creates the basic help header with tool description and usage.
 *
 * @returns {string} Help header string
 */
function getBasicHelpHeader(): string {
  return `bun-tts - Professional Audiobook Creation Tool

A powerful CLI tool for converting text documents into high-quality audiobooks using offline TTS engines.

Usage:
  bun-tts [command] [options]
  bun-tts [file] [options]

Commands:`;
}

/**
 * Formats the list of available commands with proper alignment.
 *
 * @returns {string} Formatted commands list string
 */
function formatCommandsList(): string {
  const commands = getAllCommands();
  let commandsList = '';

  for (const cmd of commands) {
    commandsList += `\n  ${cmd.name.padEnd(COMMAND_NAME_WIDTH)} ${cmd.description}`;
  }

  return commandsList;
}

/**
 * Creates the general help footer with options and examples.
 *
 * @returns {string} Help footer string
 */
function getGeneralHelpFooter(): string {
  return `

Options:
  -h, --help      Show this help message
  -v, --verbose   Enable verbose logging
  -c, --config    Path to configuration file

Global Options:
  --version       Show version information

Examples:
  bun-tts help                    Show this help message
  bun-tts help convert           Show help for convert command
  bun-tts version                Show version information
  bun-tts convert book.pdf       Convert PDF to audiobook
  bun-tts --verbose convert      Convert with verbose logging
  bun-tts --config ./cfg.json   Use custom configuration

Configuration:
  bun-tts looks for configuration files in this order:
  1. bun-tts.config.json
  2. bun-tts.config.js
  3. bun-tts.config.yml
  4. .bun-ttsrc
  5. bun-tts key in package.json

For more information, visit: https://github.com/your-repo/bun-tts`;
}

/**
 * Creates the verbose help section with debugging information.
 *
 * @returns {string} Verbose help section string
 */
function getVerboseHelpSection(): string {
  return `

Verbose Information:
- Logging level set to DEBUG
- All internal operations will be logged
- Performance metrics will be displayed
- Error stack traces will be shown

Environment Variables:
  BUN_TTS_LOG_LEVEL    Override default log level
  BUN_TTS_CONFIG_DIR   Override config search directory
  NO_COLOR            Disable colored output`;
}

/**
 * Generates version information for the bun-tts CLI tool.
 *
 * Provides detailed build information including Node.js version, platform details,
 * TypeScript version, dependencies, and feature list.
 *
 * @returns {string} Formatted version information string
 */
export function generateVersionInfo(): string {
  return `bun-tts version 0.1.0

Build Information:
- Node.js: ${process.version}
- Platform: ${process.platform} ${process.arch}
- TypeScript: 5.9.3
- React: 19.2.0
- Ink: 6.4.0

Features:
- ✓ TypeScript CLI framework
- ✓ React-based TUI interface
- ✓ Structured logging with Pino
- ✓ Configuration management
- ✓ Error handling framework
- ✓ Unit testing with Bun Test

Dependencies: 11 packages
Bundle size: 1.64MB (optimized)
License: MIT`;
}
