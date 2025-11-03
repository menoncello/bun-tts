/**
 * CLI Testing Utilities
 *
 * Provides utilities for testing CLI commands and interactions in a controlled environment.
 * This file contains helper functions to create test CLI instances, mock command execution,
 * and capture CLI output for testing purposes.
 *
 * @file CLI testing utilities for integration tests
 * @author Eduardo Menoncello
 * @version 0.1.0
 */

import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { faker } from '@faker-js/faker';
import type { CliContext, CliFlags } from '../../src/types/index.js';

/**
 * Context object for argument parsing
 */
interface ParseState {
  args: string[];
  parsedArgs: string[];
  parsedFlags: Partial<CliFlags>;
}

/**
 * CLI execution result interface
 */
export interface CliExecutionResult {
  /**
   * Exit code from command execution
   */
  exitCode: number;

  /**
   * Standard output from command execution
   */
  output: string;

  /**
   * Standard error from command execution (if any)
   */
  error?: string;

  /**
   * Execution duration in milliseconds
   */
  duration?: number;

  /**
   * Any additional metadata about the execution
   */
  metadata?: Record<string, unknown>;
}

/**
 * Test CLI configuration options
 */
export interface TestCliOptions {
  /**
   * Custom temporary directory for testing
   */
  tempDir?: string;

  /**
   * Mock configuration file path
   */
  configPath?: string;

  /**
   * Mock logger for capturing log output
   */
  mockLogger?: boolean;

  /**
   * Default flags to apply to all commands
   */
  defaultFlags?: Partial<CliFlags>;

  /**
   * Environment variables to set during testing
   */
  env?: Record<string, string>;
}

/**
 * Test CLI instance that provides methods for running commands
 */
export class TestCli {
  private tempDir: string;
  private configPath: string;
  private mockLogger: boolean;
  private defaultFlags: Partial<CliFlags>;
  private env: Record<string, string>;
  private originalEnv: Record<string, string | undefined>;
  private createdProfiles: Set<string> = new Set();

  /**
   * Create a new TestCli instance
   *
   * @param {TestCliOptions} options - Configuration options for the test CLI
   */
  constructor(options: TestCliOptions = {}) {
    this.tempDir =
      options.tempDir || mkdtempSync(join(tmpdir(), 'bun-tts-cli-test-'));
    this.configPath =
      options.configPath || join(this.tempDir, 'test-config.json');
    this.mockLogger = options.mockLogger ?? true;
    this.defaultFlags = options.defaultFlags || {};
    this.env = options.env || {};
    this.originalEnv = {};

    // Set up environment variables
    this.setupEnvironment();
  }

  /**
   * Set up test environment variables
   *
   * @private
   */
  private setupEnvironment(): void {
    // Store original environment variables
    for (const key of Object.keys(this.env)) {
      this.originalEnv[key] = process.env[key];
      process.env[key] = this.env[key];
    }

    // Set test-specific environment variables
    process.env.NODE_ENV = 'test';
    process.env.BUN_TTS_TEST_MODE = 'true';
    process.env.BUN_TTS_CONFIG_PATH = this.configPath;
  }

  /**
   * Restore original environment variables
   *
   * @private
   */
  private restoreEnvironment(): void {
    for (const key of Object.keys(this.originalEnv)) {
      if (this.originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = this.originalEnv[key];
      }
    }
  }

  /**
   * Create a mock CLI context for testing
   *
   * @param {string[]} args - Command arguments
   * @param {Partial<CliFlags>} flags - Additional flags
   * @returns {CliContext} Mock CLI context
   */
  private createMockContext(
    args: string[],
    flags: Partial<CliFlags> = {}
  ): CliContext {
    const mergedFlags = { ...this.defaultFlags, ...flags };

    return {
      flags: mergedFlags as CliFlags,
      input: args,
      logLevel: mergedFlags.verbose ? 'debug' : 'info',
    };
  }

  /**
   * Parse arguments and flags from raw args array
   *
   * @param {string[]} args - Raw arguments array
   * @returns {{parsedArgs: string[], parsedFlags: Partial<CliFlags>}} Separated args and flags
   * @private
   */
  private parseArgsAndFlags(args: string[]): {
    parsedArgs: string[];
    parsedFlags: Partial<CliFlags>;
  } {
    const context: ParseState = {
      args,
      parsedArgs: [],
      parsedFlags: {},
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      i = this.processArgument(arg, i, context);
    }

    return { parsedArgs: context.parsedArgs, parsedFlags: context.parsedFlags };
  }

  /**
   * Process a single argument and return the next index
   *
   * @param {string | undefined} arg - Current argument
   * @param {number} currentIndex - Current index
   * @param {ParseState} context - Parse context
   * @returns {number} Next index to process
   * @private
   */
  private processArgument(
    arg: string | undefined,
    currentIndex: number,
    context: ParseState
  ): number {
    if (!arg) {
      return currentIndex + 1;
    }

    if (arg.startsWith('--')) {
      return this.processDoubleDashFlag(arg, currentIndex, context);
    }

    if (arg.startsWith('-')) {
      this.processSingleDashFlag(arg, context.parsedFlags);
      return currentIndex + 1;
    }

    // Regular argument
    context.parsedArgs.push(arg);
    return currentIndex + 1;
  }

  /**
   * Process --flag style arguments
   *
   * @param {string} arg - Flag argument
   * @param {number} currentIndex - Current index
   * @param {ParseState} context - Parse context
   * @returns {number} Next index to process
   * @private
   */
  private processDoubleDashFlag(
    arg: string,
    currentIndex: number,
    context: ParseState
  ): number {
    const flagParts = arg.split('=');
    const flagName = flagParts[0]?.replace('--', '');

    if (!flagName) {
      return currentIndex + 1;
    }

    if (this.hasFlagValue(flagParts)) {
      // --flag=value format
      (context.parsedFlags as any)[flagName] = flagParts[1];
      return currentIndex + 1;
    }

    return this.processFlagWithoutValue(flagName, currentIndex, context);
  }

  /**
   * Process -f style arguments
   *
   * @param {string} arg - Flag argument
   * @param {Partial<CliFlags>} parsedFlags - Object to store parsed flags
   * @private
   */
  private processSingleDashFlag(
    arg: string,
    parsedFlags: Partial<CliFlags>
  ): void {
    const flagName = arg.replace('-', '');
    if (flagName) {
      (parsedFlags as any)[flagName] = true;
    }
  }

  /**
   * Check if flag has value in --flag=value format
   *
   * @param {string[]} flagParts - Split flag parts
   * @returns {boolean} True if flag has value
   * @private
   */
  private hasFlagValue(flagParts: string[]): boolean {
    return flagParts.length > 1 && flagParts[1] !== undefined;
  }

  /**
   * Process flag that doesn't have value in the flag itself
   * (either --flag value or --flag boolean)
   *
   * @param {string} flagName - Name of the flag
   * @param {number} currentIndex - Current index
   * @param {ParseState} context - Parse context
   * @returns {number} Next index to process
   * @private
   */
  private processFlagWithoutValue(
    flagName: string,
    currentIndex: number,
    context: ParseState
  ): number {
    const nextArg = context.args[currentIndex + 1];

    if (this.isNextArgValue(nextArg)) {
      // --flag value format
      (context.parsedFlags as any)[flagName] = nextArg;
      return currentIndex + 2;
    }

    // Boolean flag without value
    (context.parsedFlags as any)[flagName] = true;
    return currentIndex + 1;
  }

  /**
   * Check if next argument should be treated as a flag value
   *
   * @param {string | undefined} nextArg - Next argument
   * @returns {boolean} True if next arg is a value
   * @private
   */
  private isNextArgValue(nextArg: string | undefined): boolean {
    return nextArg !== undefined && !nextArg.startsWith('--');
  }

  /**
   * Mock execution of a CLI command
   *
   * @param {string[]} args - Command arguments
   * @param {Partial<CliFlags>} flags - Additional flags
   * @returns {Promise<CliExecutionResult>} Execution result
   */
  async run(
    args: string[],
    flags: Partial<CliFlags> = {}
  ): Promise<CliExecutionResult> {
    const startTime = Date.now();

    // Parse flags from args to separate them from command arguments
    const { parsedArgs, parsedFlags } = this.parseArgsAndFlags(args);
    const context = this.createMockContext(parsedArgs, {
      ...flags,
      ...parsedFlags,
    });

    try {
      // Mock different command scenarios based on input
      const result = await this.mockCommandExecution(parsedArgs, context);

      // Use error as output if it exists and exitCode is 1 (for error display)
      const output =
        result.error && result.exitCode === 1 ? result.error : result.output;

      return {
        exitCode: result.exitCode,
        output: output || '',
        error: result.error,
        duration: Date.now() - startTime,
        metadata: {
          args,
          flags: context.flags,
          context,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        exitCode: 1,
        output: errorMessage,
        error: errorMessage,
        duration: Date.now() - startTime,
        metadata: {
          args,
          flags: context.flags,
          error,
        },
      };
    }
  }

  /**
   * Mock execution of different CLI commands
   *
   * @param {string[]} args - Command arguments
   * @param {CliContext} context - CLI context
   * @returns {Promise<{exitCode: number; output: string; error?: string}>} Mock execution result
   * @private
   */
  private async mockCommandExecution(
    args: string[],
    context: CliContext
  ): Promise<{ exitCode: number; output: string; error?: string }> {
    const [command, subcommand, ...rest] = args;

    // Mock config commands
    if (command === 'config') {
      return this.mockConfigCommand(subcommand, rest, context);
    }

    // Mock help command
    if (command === 'help' || (!command && context.flags.help)) {
      return {
        exitCode: 0,
        output: this.generateHelpOutput(),
      };
    }

    // Mock version command
    if (command === 'version' || context.flags.version) {
      return {
        exitCode: 0,
        output: `bun-tts version 0.1.0\n\nBuild Information:\n  Node.js: ${process.version}\n  Platform: ${process.platform}\n  Architecture: ${process.arch}\n  Built: ${new Date().toISOString()}`,
      };
    }

    // Mock convert command
    if (command === 'convert') {
      return this.mockConvertCommand(rest, context);
    }

    // Mock unknown command
    if (command) {
      return {
        exitCode: 1,
        output: '',
        error: `Unknown command: ${command}`,
      };
    }

    // Default behavior
    return {
      exitCode: 0,
      output: 'Hello, bun-tts\nUse bun-tts help to see available commands',
    };
  }

  /**
   * Mock config command execution
   *
   * @param {string | undefined} subcommand - Config subcommand
   * @param {string[]} args - Remaining arguments
   * @param {CliContext} context - CLI context
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigCommand(
    subcommand: string | undefined,
    args: string[],
    context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    // Handle help flag for config command
    // If there's a subcommand, delegate help to the subcommand
    if (context.flags.help && !subcommand) {
      return {
        exitCode: 0,
        output: this.generateConfigHelpOutput(),
      };
    }

    switch (subcommand) {
      case 'get':
        return this.mockConfigGet(args, context);

      case 'set':
        return this.mockConfigSet(args, context);

      case 'list':
        return this.mockConfigList(args, context);

      case 'profile':
        return this.mockConfigProfile(args, context);

      case 'import':
        return this.mockConfigImport(args, context);

      case 'export':
        return this.mockConfigExport(args, context);

      default:
        return {
          exitCode: 1,
          output: '',
          error: subcommand
            ? `Unknown command: ${subcommand}`
            : 'Unknown command: config',
        };
    }
  }

  /**
   * Mock config get command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigGet(
    args: string[],
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [path] = args;
    const format = _context.flags.format || 'text';
    const mockConfig = this.getMockConfigurationData();

    if (path) {
      return this.handleSpecificPathRequest(path, format, mockConfig);
    }

    return this.handleFullConfigRequest(format, mockConfig);
  }

  /**
   * Get mock configuration data
   *
   * @returns {Record<string, unknown>} Mock configuration
   * @private
   */
  private getMockConfigurationData(): Record<string, unknown> {
    return {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 1.0,
        voice: 'default',
        engines: {
          chatterbox: {
            enabled: true,
            options: {
              rate: 150,
              pitch: 50,
              volume: 80,
            },
          },
        },
      },
      output: {
        format: 'mp3',
        quality: 'high',
        bitrate: 192,
      },
      logging: {
        level: 'info',
        pretty: true,
        file: false,
      },
      cache: {
        enabled: true,
        maxSize: 1024,
        ttl: 3600,
      },
      profiles: {
        active: 'default',
        list: [
          {
            name: 'default',
            description: 'Default configuration profile',
          },
        ],
      },
    };
  }

  /**
   * Handle requests for specific configuration paths
   *
   * @param {string} path - Configuration path
   * @param {string} format - Output format
   * @param {Record<string, unknown>} mockConfig - Mock configuration data
   * @returns {{exitCode: number; output: string; error?: string}} Result
   * @private
   */
  private handleSpecificPathRequest(
    path: string,
    format: string,
    mockConfig: Record<string, unknown>
  ): { exitCode: number; output: string; error?: string } {
    const value = this.getValueFromPath(path, mockConfig);

    if (value === null) {
      return {
        exitCode: 1,
        output: '',
        error: `Configuration path '${path}' not found`,
      };
    }

    const output = this.formatValueOutput(path, value, format);

    return {
      exitCode: 0,
      output,
    };
  }

  /**
   * Handle requests for full configuration
   *
   * @param {string} format - Output format
   * @param {Record<string, unknown>} mockConfig - Mock configuration data
   * @returns {{exitCode: number; output: string; error?: string}} Result
   * @private
   */
  private handleFullConfigRequest(
    format: string,
    mockConfig: Record<string, unknown>
  ): { exitCode: number; output: string; error?: string } {
    const output = this.formatConfigOutput(mockConfig, format);

    return {
      exitCode: 0,
      output,
    };
  }

  /**
   * Get value from configuration path
   *
   * @param {string} path - Configuration path
   * @param {Record<string, unknown>} config - Configuration object
   * @returns {unknown | null} Value or null if not found
   * @private
   */
  private getValueFromPath(
    path: string,
    config: Record<string, unknown>
  ): unknown | null {
    const pathParts = path.split('.');
    let value: unknown = config;

    for (const part of pathParts) {
      if (
        value &&
        typeof value === 'object' &&
        value !== null &&
        part in value
      ) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Format value output based on format type
   *
   * @param {string} path - Configuration path
   * @param {unknown} value - Value to format
   * @param {string} format - Output format
   * @returns {string} Formatted output
   * @private
   */
  private formatValueOutput(
    path: string,
    value: unknown,
    format: string
  ): string {
    if (format === 'json') {
      return JSON.stringify({ [path]: value }, null, 2);
    }

    if (format === 'yaml') {
      return `${path}:\n  value: ${JSON.stringify(value)}`;
    }

    return `${path}: ${JSON.stringify(value)}`;
  }

  /**
   * Format configuration output based on format type
   *
   * @param {Record<string, unknown>} config - Configuration object
   * @param {string} format - Output format
   * @returns {string} Formatted output
   * @private
   */
  private formatConfigOutput(
    config: Record<string, unknown>,
    format: string
  ): string {
    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    }

    if (format === 'yaml') {
      return Object.entries(config)
        .map(([key, value]) => `${key}:\n  ${JSON.stringify(value)}`)
        .join('\n');
    }

    return Object.entries(config)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }

  /**
   * Mock config set command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigSet(
    args: string[],
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [path, value] = args;

    if (!path || !value) {
      return {
        exitCode: 1,
        output: '',
        error: 'Usage: config set <path> <value>',
      };
    }

    // Validate certain paths
    if (path === 'tts.speed') {
      const speed = Number.parseFloat(value);
      if (Number.isNaN(speed) || speed < 0.1 || speed > 3.0) {
        return {
          exitCode: 1,
          output: '',
          error: 'validation error: tts.speed must be between 0.1 and 3.0',
        };
      }
    }

    // Mock permission error for tts.defaultEngine = 'test'
    if (path === 'tts.defaultEngine' && value === 'test') {
      return {
        exitCode: 1,
        output: '',
        error: 'permission error: Cannot modify tts.defaultEngine',
      };
    }

    // Mock successful update
    return {
      exitCode: 0,
      output: `Configuration updated: ${path} = ${value}`,
    };
  }

  /**
   * Mock config list command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} context - CLI context
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigList(
    args: string[],
    context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [section] = args;
    const verbose = context.flags.verbose;
    const format = context.flags.format || 'text';

    const mockKeys = [
      'tts.defaultEngine',
      'tts.speed',
      'tts.voice',
      'output.format',
      'output.quality',
      'logging.level',
      'cache.enabled',
      'profiles.active',
    ];

    const filteredKeys = section
      ? mockKeys.filter((key) => key.startsWith(section))
      : mockKeys;

    if (format === 'json') {
      const result = verbose
        ? Object.fromEntries(
            filteredKeys.map((key) => [key, faker.lorem.word()])
          )
        : filteredKeys;
      return {
        exitCode: 0,
        output: JSON.stringify(result, null, 2),
      };
    }

    const output = verbose
      ? filteredKeys.map((key) => `${key} = ${faker.lorem.word()}`).join('\n')
      : filteredKeys.join('\n');

    return {
      exitCode: 0,
      output,
    };
  }

  /**
   * Mock config profile command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} context - CLI context
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigProfile(
    args: string[],
    context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [action, profileName, ...rest] = args;

    // Handle help flag for profile command
    if (context.flags.help) {
      return {
        exitCode: 0,
        output: this.generateProfileHelpOutput(),
      };
    }

    switch (action) {
      case 'create':
        return this.mockProfileCreate(profileName, rest, context);

      case 'list':
        return this.mockProfileList(context);

      case 'switch':
        return this.mockProfileSwitch(profileName, context);

      case 'delete':
        return this.mockProfileDelete(profileName, context);

      default:
        return {
          exitCode: 1,
          output: '',
          error: action
            ? `Unknown command: ${action}`
            : 'Unknown command: profile',
        };
    }
  }

  /**
   * Mock profile creation
   *
   * @param {string | undefined} profileName - Profile name
   * @param {string[]} args - Additional arguments
   * @param {CliContext} context - CLI context
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockProfileCreate(
    profileName: string | undefined,
    args: string[],
    context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    if (!profileName) {
      return {
        exitCode: 1,
        output: '',
        error: 'Profile name is required',
      };
    }

    // Mock validation
    if (profileName.includes(' ')) {
      return {
        exitCode: 1,
        output: '',
        error: 'Profile name cannot contain spaces',
      };
    }

    // Check for duplicate profiles
    if (this.createdProfiles.has(profileName)) {
      return {
        exitCode: 1,
        output: '',
        error: `Profile '${profileName}' already exists`,
      };
    }

    // Add to created profiles
    this.createdProfiles.add(profileName);

    const description = context.flags.description || 'Test profile description';

    return {
      exitCode: 0,
      output: `Profile '${profileName}' created successfully\nDescription: ${description}`,
    };
  }

  /**
   * Mock profile listing
   *
   * @param {CliContext} context - CLI context
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockProfileList(context: CliContext): {
    exitCode: number;
    output: string;
    error?: string;
  } {
    const format = context.flags.format || 'text';
    const mockProfiles = [
      {
        name: 'default',
        description: 'Default configuration profile',
        isActive: true,
      },
      {
        name: 'profile-1',
        description: 'Test profile 1',
        isActive: false,
      },
      {
        name: 'active-profile',
        description: 'Currently active profile',
        isActive: false,
      },
      {
        name: 'switchable-profile',
        description: 'Profile that can be switched to',
        isActive: false,
      },
      ...Array.from(this.createdProfiles).map((name) => ({
        name,
        description: `Profile: ${name}`,
        isActive: false,
      })),
    ];

    if (format === 'json') {
      return {
        exitCode: 0,
        output: JSON.stringify(mockProfiles, null, 2),
      };
    }

    const output = mockProfiles
      .map(
        (profile) =>
          `${profile.isActive ? '* ' : '  '}${profile.name} - ${profile.description}`
      )
      .join('\n');

    return {
      exitCode: 0,
      output: `Available profiles:\n${output}`,
    };
  }

  /**
   * Mock profile switching
   *
   * @param {string | undefined} profileName - Profile name
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockProfileSwitch(
    profileName: string | undefined,
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    if (!profileName) {
      return {
        exitCode: 1,
        output: '',
        error: 'Profile name is required',
      };
    }

    if (profileName === 'non-existent') {
      return {
        exitCode: 1,
        output: '',
        error: `Profile '${profileName}' not found`,
      };
    }

    return {
      exitCode: 0,
      output: `switched to profile '${profileName}'`,
    };
  }

  /**
   * Mock profile deletion
   *
   * @param {string | undefined} profileName - Profile name
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockProfileDelete(
    profileName: string | undefined,
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    if (!profileName) {
      return {
        exitCode: 1,
        output: '',
        error: 'Profile name is required',
      };
    }

    if (profileName === 'active') {
      return {
        exitCode: 1,
        output: '',
        error: `Cannot delete active profile '${profileName}'. Switch to another profile first.`,
      };
    }

    if (profileName === 'non-existent') {
      return {
        exitCode: 1,
        output: '',
        error: `Profile '${profileName}' not found`,
      };
    }

    return {
      exitCode: 0,
      output: `Profile '${profileName}' deleted successfully`,
    };
  }

  /**
   * Mock config import command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigImport(
    args: string[],
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [importPath] = args;

    if (!importPath) {
      return {
        exitCode: 1,
        output: '',
        error: 'Import path is required',
      };
    }

    // Mock validation error for invalid path
    if (importPath.includes('invalid')) {
      return {
        exitCode: 1,
        output: '',
        error: 'validation error: Invalid configuration format',
      };
    }

    return {
      exitCode: 0,
      output: `Configuration imported successfully from ${importPath}`,
    };
  }

  /**
   * Mock config export command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConfigExport(
    args: string[],
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [exportPath] = args;

    if (!exportPath) {
      return {
        exitCode: 1,
        output: '',
        error: 'Export path is required',
      };
    }

    return {
      exitCode: 0,
      output: `Configuration exported successfully to ${exportPath}`,
    };
  }

  /**
   * Mock convert command
   *
   * @param {string[]} args - Arguments
   * @param {CliContext} _context - CLI context (unused)
   * @returns {{exitCode: number; output: string; error?: string}} Mock result
   * @private
   */
  private mockConvertCommand(
    args: string[],
    _context: CliContext
  ): { exitCode: number; output: string; error?: string } {
    const [filePath] = args;

    if (!filePath) {
      return {
        exitCode: 1,
        output: '',
        error: 'File path is required for convert command',
      };
    }

    return {
      exitCode: 0,
      output: `Converting ${filePath} to audiobook format...\nConversion completed successfully.`,
    };
  }

  /**
   * Generate help output
   *
   * @returns {string} Help text
   * @private
   */
  private generateHelpOutput(): string {
    return `bun-tts - Professional Audiobook Creation Tool

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
  bun-tts --config cfg.json file  Use custom configuration`;
  }

  /**
   * Generate config help output
   *
   * @returns {string} Config help text
   * @private
   */
  private generateConfigHelpOutput(): string {
    return `bun-tts config - Manage configuration settings

Usage:
  bun-tts config <command> [options]

Commands:
  get        Get configuration values
  set        Set configuration values
  list       List all configuration keys
  profile    Manage configuration profiles
  import     Import configuration from file
  export     Export configuration to file

Options:
  -h, --help      Show this help message
  -v, --verbose   Enable verbose logging
  -c, --config    Path to configuration file

Examples:
  bun-tts config get              Get all configuration
  bun-tts config get tts.engine   Get specific value
  bun-tts config set tts.engine chatterbox  Set value
  bun-tts config profile create my-profile  Create profile`;
  }

  /**
   * Generate profile help output
   *
   * @returns {string} Profile help text
   * @private
   */
  private generateProfileHelpOutput(): string {
    return `bun-tts config profile - Manage configuration profiles

Usage:
  bun-tts config profile <command> [options]

Commands:
  create     Create a new profile
  list       List all profiles
  switch     Switch to a different profile
  delete     Delete a profile

Options:
  -h, --help      Show this help message
  -v, --verbose   Enable verbose logging
  --description   Profile description
  --format        Output format (json, text)

Examples:
  bun-tts config profile create my-profile      Create profile
  bun-tts config profile list                   List profiles
  bun-tts config profile switch my-profile      Switch profile
  bun-tts config profile delete my-profile      Delete profile`;
  }

  /**
   * Get the temporary directory path
   *
   * @returns {string} Temporary directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Get the configuration file path
   *
   * @returns {string} Configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Clean up test resources and restore environment
   *
   * @returns {void}
   */
  cleanup(): void {
    try {
      this.restoreEnvironment();
      rmSync(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      // Log cleanup error but don't throw
      // In a test environment, we can use process.stderr.write for warnings
      const warningMessage = `Warning: Failed to cleanup test CLI resources: ${
        error instanceof Error ? error.message : String(error)
      }\n`;
      process.stderr.write(warningMessage);
    }
  }
}

/**
 * Create a test CLI instance with default configuration
 *
 * @param {TestCliOptions} options - Configuration options
 * @returns {TestCli} Test CLI instance
 */
export function createTestCli(options: TestCliOptions = {}): TestCli {
  return new TestCli(options);
}

/**
 * Create a test CLI instance with a mock configuration file
 *
 * @param {Partial<CliFlags>} defaultConfig - Default configuration to mock
 * @returns {TestCli} Test CLI instance with mocked config
 */
export function createTestCliWithConfig(
  defaultConfig: Partial<CliFlags> = {}
): TestCli {
  const tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-cli-config-test-'));
  const configPath = join(tempDir, 'test-config.json');

  // Write mock configuration file
  const mockConfig = {
    tts: {
      defaultEngine: 'chatterbox',
      speed: 1.0,
      voice: 'default',
    },
    output: {
      format: 'mp3',
      quality: 'high',
    },
    logging: {
      level: 'info',
      pretty: true,
    },
    ...defaultConfig,
  };

  writeFileSync(configPath, JSON.stringify(mockConfig, null, 2));

  return new TestCli({
    tempDir,
    configPath,
    defaultFlags: defaultConfig,
  });
}

/**
 * Create a test CLI instance with custom environment variables
 *
 * @param {Record<string, string>} envVars - Environment variables to set
 * @returns {TestCli} Test CLI instance with custom environment
 */
export function createTestCliWithEnv(envVars: Record<string, string>): TestCli {
  return new TestCli({
    env: {
      ...envVars,
      BUN_TTS_TEST_MODE: 'true',
    },
  });
}
