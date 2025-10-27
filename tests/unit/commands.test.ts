import { describe, it, expect, beforeEach } from 'bun:test';
import {
  getCommand,
  getAllCommands,
  formatCommandHelp,
} from '../../src/cli/commands/index.js';
import type { CliContext } from '../../src/types/index.js';

function createMockContext(): CliContext {
  return {
    flags: {
      config: undefined,
      verbose: false,
      help: false,
    },
    input: [],
    logLevel: 'info',
  };
}

describe('CLI Commands - getCommand', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('should return help command', () => {
    const command = getCommand('help');
    expect(command).toBeDefined();
    expect(command?.name).toBe('help');
    expect(command?.description).toContain('help message');
  });

  it('should return version command', () => {
    const command = getCommand('version');
    expect(command).toBeDefined();
    expect(command?.name).toBe('version');
    expect(command?.description).toContain('version information');
  });

  it('should return convert command', () => {
    const command = getCommand('convert');
    expect(command).toBeDefined();
    expect(command?.name).toBe('convert');
    expect(command?.description).toContain('audiobook format');
  });

  it('should handle case insensitive commands', () => {
    const command = getCommand('HELP');
    expect(command).toBeDefined();
    expect(command?.name).toBe('help');
  });

  it('should return undefined for unknown command', () => {
    const command = getCommand('unknown');
    expect(command).toBeUndefined();
  });
});

describe('CLI Commands - getAllCommands', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('should return all available commands', () => {
    const commands = getAllCommands();
    expect(commands).toHaveLength(4);

    validateCommandNames(commands);
  });

  it('should return commands with required properties', () => {
    const commands = getAllCommands();

    validateCommandProperties(commands);
  });
});

describe('CLI Commands - formatCommandHelp', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('should format help command correctly', () => {
    const command = getCommand('help');
    const helpText = formatCommandHelp(command!);

    validateHelpCommandFormat(helpText);
  });

  it('should format version command correctly', () => {
    const command = getCommand('version');
    const helpText = formatCommandHelp(command!);

    validateVersionCommandFormat(helpText);
  });

  it('should format convert command correctly', () => {
    const command = getCommand('convert');
    const helpText = formatCommandHelp(command!);

    validateConvertCommandFormat(helpText);
  });
});

// Helper validation functions
function validateCommandNames(commands: any[]): void {
  const commandNames = commands.map((c) => c.name);
  expect(commandNames).toContain('help');
  expect(commandNames).toContain('version');
  expect(commandNames).toContain('convert');
  expect(commandNames).toContain('config');
}

function validateCommandProperties(commands: any[]): void {
  commands.forEach((command) => {
    expect(command).toHaveProperty('name');
    expect(command).toHaveProperty('description');
    expect(command).toHaveProperty('handler');
    expect(typeof command.handler).toBe('function');
  });
}

function validateHelpCommandFormat(helpText: string): void {
  expect(helpText).toContain('help - Show help message');
  expect(helpText).toContain('Examples:');
  expect(helpText).toContain('bun-tts help');
}

function validateVersionCommandFormat(helpText: string): void {
  expect(helpText).toContain('version - Show version');
  expect(helpText).toContain('Examples:');
  expect(helpText).toContain('bun-tts version');
}

function validateConvertCommandFormat(helpText: string): void {
  expect(helpText).toContain('convert - Convert');
  expect(helpText).toContain('Examples:');
  expect(helpText).toContain('bun-tts convert document.pdf');
}
