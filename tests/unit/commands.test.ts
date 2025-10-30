import { describe, it, expect, beforeEach } from 'bun:test';
import {
  getCommand,
  getAllCommands,
  formatCommandHelp,
  TypeSafeCommandRegistry,
  validateCommandName,
  commands,
  _defaultCommandRegistry,
} from '../../src/cli/commands/index.js';
import type { CliContext, Command } from '../../src/types/index.js';

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
  let _mockContext: CliContext;

  beforeEach(() => {
    _mockContext = createMockContext();
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
  let _mockContext: CliContext;

  beforeEach(() => {
    _mockContext = createMockContext();
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
  let _mockContext: CliContext;

  beforeEach(() => {
    _mockContext = createMockContext();
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
  for (const command of commands) {
    expect(command).toHaveProperty('name');
    expect(command).toHaveProperty('description');
    expect(command).toHaveProperty('handler');
    expect(typeof command.handler).toBe('function');
  }
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

describe('CLI Commands - getCommand Edge Cases', () => {
  it('should handle null command name', () => {
    const command = getCommand(null as any);
    expect(command).toBeUndefined();
  });

  it('should handle undefined command name', () => {
    const command = getCommand(undefined as any);
    expect(command).toBeUndefined();
  });

  it('should handle empty string command name', () => {
    const command = getCommand('');
    expect(command).toBeUndefined();
  });

  it('should handle whitespace-only command name', () => {
    const command = getCommand('   ');
    expect(command).toBeUndefined();
  });

  it('should handle command name with leading/trailing whitespace', () => {
    const command = getCommand('  help  ');
    expect(command).toBeDefined();
    expect(command?.name).toBe('help');
  });

  it('should handle various case combinations', () => {
    const testCases = [
      'HELP',
      'Help',
      'hElP',
      'HeLp',
      'VERSION',
      'Version',
      'version',
      'CONVERT',
      'Convert',
      'CONFIG',
      'Config',
    ];

    for (const testCase of testCases) {
      const command = getCommand(testCase);
      expect(command).toBeDefined();
      expect(command?.name).toBe(testCase.toLowerCase());
    }
  });

  it('should handle command names with special characters', () => {
    const invalidCommands = [
      'help!',
      'version#',
      'convert@',
      'config$',
      'cmd%',
    ];
    for (const cmd of invalidCommands) {
      const command = getCommand(cmd);
      expect(command).toBeUndefined();
    }
  });

  it('should handle numeric command names', () => {
    const command = getCommand('123');
    expect(command).toBeUndefined();
  });

  it('should handle very long command names', () => {
    const longCommandName = 'a'.repeat(1000);
    const command = getCommand(longCommandName);
    expect(command).toBeUndefined();
  });

  it('should return actual command objects (not copies)', () => {
    const command1 = getCommand('help');
    const command2 = getCommand('help');
    expect(command1).toBe(command2); // Should be the same object reference
  });
});

describe('CLI Commands - getAllCommands Edge Cases', () => {
  it('should return consistent results across multiple calls', () => {
    const commands1 = getAllCommands();
    const commands2 = getAllCommands();

    expect(commands1).toHaveLength(commands2.length);
    expect(commands1.map((c) => c.name)).toEqual(commands2.map((c) => c.name));
  });

  it('should return commands in a consistent order', () => {
    const commands1 = getAllCommands();
    const commands2 = getAllCommands();

    expect(commands1.map((c) => c.name)).toEqual(commands2.map((c) => c.name));
  });

  it('should return commands with unique names', () => {
    const commands = getAllCommands();
    const commandNames = commands.map((c) => c.name);
    const uniqueNames = new Set(commandNames);

    expect(uniqueNames.size).toBe(commandNames.length);
  });

  it('should return commands that are all valid command objects', () => {
    const commands = getAllCommands();

    for (const command of commands) {
      expect(command).toHaveProperty('name');
      expect(command).toHaveProperty('description');
      expect(command).toHaveProperty('handler');
      expect(typeof command.handler).toBe('function');
      expect(typeof command.name).toBe('string');
      expect(typeof command.description).toBe('string');
      expect(command.name.length).toBeGreaterThan(0);
      expect(command.description.length).toBeGreaterThan(0);
    }
  });

  it('should return config command with expected properties', () => {
    const commands = getAllCommands();
    const configCommand = commands.find((c) => c.name === 'config');

    expect(configCommand).toBeDefined();
    expect(configCommand?.description).toContain('configuration');
    expect(configCommand?.examples).toBeDefined();
    expect(Array.isArray(configCommand?.examples)).toBe(true);
  });
});

describe('CLI Commands - formatCommandHelp Edge Cases', () => {
  it('should handle null command', () => {
    const helpText = formatCommandHelp(null as any);
    expect(helpText).toBe('Invalid command: command object is required');
  });

  it('should handle undefined command', () => {
    const helpText = formatCommandHelp(undefined as any);
    expect(helpText).toBe('Invalid command: command object is required');
  });

  it('should handle command with no examples', () => {
    const mockCommand: Command = {
      name: 'test',
      description: 'Test command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    const helpText = formatCommandHelp(mockCommand);
    expect(helpText).toContain('test - Test command');
    expect(helpText).not.toContain('Examples:');
  });

  it('should handle command with empty examples array', () => {
    const mockCommand: Command = {
      name: 'test',
      description: 'Test command',
      handler: async () => {
        // Empty handler for testing
      },
      examples: [],
    };

    const helpText = formatCommandHelp(mockCommand);
    expect(helpText).toContain('test - Test command');
    expect(helpText).not.toContain('Examples:');
  });

  it('should handle command with multiple examples', () => {
    const mockCommand: Command = {
      name: 'test',
      description: 'Test command',
      handler: async () => {
        // Empty handler for testing
      },
      examples: [
        'test command option1',
        'test command option2',
        'test command option3',
      ],
    };

    const helpText = formatCommandHelp(mockCommand);
    expect(helpText).toContain('test - Test command');
    expect(helpText).toContain('Examples:');
    expect(helpText).toContain('test command option1');
    expect(helpText).toContain('test command option2');
    expect(helpText).toContain('test command option3');
  });

  it('should handle command with multiline description', () => {
    const mockCommand: Command = {
      name: 'multiline',
      description: 'This is a command\nwith a multiline\ndescription',
      handler: async () => {
        // Empty handler for testing
      },
      examples: ['multiline example'],
    };

    const helpText = formatCommandHelp(mockCommand);
    expect(helpText).toContain('multiline - This is a command');
    expect(helpText).toContain('Examples:');
    expect(helpText).toContain('multiline example');
  });

  it('should handle command with special characters in description', () => {
    const mockCommand: Command = {
      name: 'special',
      description: 'Command with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      handler: async () => {
        // Empty handler for testing
      },
    };

    const helpText = formatCommandHelp(mockCommand);
    expect(helpText).toContain(
      'special - Command with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
    );
  });
});

describe('CLI Commands - TypeSafeCommandRegistry', () => {
  let registry: TypeSafeCommandRegistry;

  beforeEach(() => {
    registry = new TypeSafeCommandRegistry();
  });

  it('should create empty registry by default', () => {
    const emptyRegistry = new TypeSafeCommandRegistry();
    expect(emptyRegistry.getAll()).toHaveLength(0);
  });

  it('should create registry with initial commands', () => {
    const mockCommand: Command = {
      name: 'test',
      description: 'Test command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    const registryWithCommands = new TypeSafeCommandRegistry({
      test: mockCommand,
    });
    expect(registryWithCommands.getAll()).toHaveLength(1);
    expect(registryWithCommands.get('test')).toBeDefined();
  });

  it('should register new commands successfully', () => {
    const mockCommand: Command = {
      name: 'newCommand',
      description: 'A new command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    registry.register(mockCommand);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('newCommand')).toBeDefined();
  });

  it('should normalize command names to lowercase', () => {
    const mockCommand: Command = {
      name: 'CamelCaseCommand',
      description: 'Camel case command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    registry.register(mockCommand);
    expect(registry.get('CamelCaseCommand')).toBeDefined();
    expect(registry.get('camelcasecommand')).toBeDefined();
    expect(registry.get('CAMELCASECOMMAND')).toBeDefined();
  });

  it('should prevent duplicate command registration', () => {
    const mockCommand: Command = {
      name: 'duplicate',
      description: 'Duplicate command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    registry.register(mockCommand);

    expect(() => {
      registry.register(mockCommand);
    }).toThrow("Command 'duplicate' is already registered");
  });

  it('should return commands object that is a copy', () => {
    const mockCommand: Command = {
      name: 'readonly',
      description: 'Readonly command',
      handler: async () => {
        // Empty handler for testing
      },
    };

    registry.register(mockCommand);
    const commands = registry.commands;

    // Commands should be a copy, not the original registry
    expect(commands).not.toBe((registry as any)._commands);
    expect(commands).toEqual((registry as any)._commands);
  });

  describe('Command Validation', () => {
    it('should validate command name is non-empty string', () => {
      const invalidCommands = [
        {
          name: '',
          description: 'Valid',
          handler: async () => {
            throw new Error('Empty name');
          },
        },
        {
          name: '   ',
          description: 'Valid',
          handler: async () => {
            throw new Error('Whitespace name');
          },
        },
        {
          name: null as any,
          description: 'Valid',
          handler: async () => {
            throw new Error('Null name');
          },
        },
        {
          name: undefined as any,
          description: 'Valid',
          handler: async () => {
            throw new Error('Undefined name');
          },
        },
        {
          name: 123 as any,
          description: 'Valid',
          handler: async () => {
            throw new Error('Number name');
          },
        },
      ];

      for (const cmd of invalidCommands) {
        expect(() => registry.register(cmd as any)).toThrow();
      }
    });

    it('should validate command description is non-empty string', () => {
      const invalidCommands = [
        {
          name: 'valid',
          description: '',
          handler: async () => {
            throw new Error('Empty description');
          },
        },
        {
          name: 'valid',
          description: '   ',
          handler: async () => {
            throw new Error('Whitespace description');
          },
        },
        {
          name: 'valid',
          description: null as any,
          handler: async () => {
            throw new Error('Null description');
          },
        },
        {
          name: 'valid',
          description: undefined as any,
          handler: async () => {
            throw new Error('Undefined description');
          },
        },
        {
          name: 'valid',
          description: 123 as any,
          handler: async () => {
            throw new Error('Number description');
          },
        },
      ];

      for (const cmd of invalidCommands) {
        expect(() => registry.register(cmd as any)).toThrow();
      }
    });

    it('should validate command handler is function', () => {
      const invalidCommands = [
        { name: 'valid', description: 'Valid', handler: null as any },
        { name: 'valid', description: 'Valid', handler: undefined as any },
        { name: 'valid', description: 'Valid', handler: 'string' as any },
        { name: 'valid', description: 'Valid', handler: {} as any },
        { name: 'valid', description: 'Valid', handler: 123 as any },
      ];

      for (const cmd of invalidCommands) {
        expect(() => registry.register(cmd as any)).toThrow(
          'Command handler must be a function'
        );
      }
    });

    it('should validate examples array contains only strings', () => {
      const invalidCommands = [
        {
          name: 'valid',
          description: 'Valid',
          handler: async () => {
            throw new Error('Invalid examples array');
          },
          examples: [123],
        },
        {
          name: 'valid',
          description: 'Valid',
          handler: async () => {
            throw new Error('Invalid examples array');
          },
          examples: [null],
        },
        {
          name: 'valid',
          description: 'Valid',
          handler: async () => {
            throw new Error('Invalid examples array');
          },
          examples: [{}],
        },
        {
          name: 'valid',
          description: 'Valid',
          handler: async () => {
            throw new Error('Invalid examples array');
          },
          examples: ['valid', 123],
        },
      ];

      for (const cmd of invalidCommands) {
        expect(() => registry.register(cmd as any)).toThrow(
          'Command examples must be an array of strings'
        );
      }
    });

    it('should validate complete command object', () => {
      expect(() => registry.register(null as any)).toThrow(
        'Command object is required'
      );
      expect(() => registry.register(undefined as any)).toThrow(
        'Command object is required'
      );
      expect(() => registry.register({} as any)).toThrow(
        'Command name must be a non-empty string'
      );
    });
  });
});

describe('CLI Commands - validateCommandName', () => {
  it('should validate valid command names', () => {
    const validNames = [
      'help',
      'version',
      'convert',
      'config',
      'test-command',
      'test_command',
      'command123',
      'a',
      'very-long-command-name-that-is-still-valid',
    ];

    for (const name of validNames) {
      expect(() => validateCommandName(name)).not.toThrow();
    }
  });

  it('should reject invalid command names', () => {
    const invalidNames = [
      '',
      '   ',
      null,
      undefined,
      '123command',
      '-command',
      '_command',
      'command!',
      'command@',
      'command#',
      'command with spaces',
      'command.dotted',
      'command/slash',
      'command\\backslash',
      'a'.repeat(51), // Too long
    ];

    for (const name of invalidNames) {
      expect(() => validateCommandName(name as any)).toThrow();
    }
  });

  it('should provide specific error messages', () => {
    expect(() => validateCommandName('')).toThrow(
      'Command name must be a non-empty string'
    );
    expect(() => validateCommandName('   ')).toThrow(
      'Command name cannot be empty or whitespace only'
    );
    expect(() => validateCommandName('123command')).toThrow(
      'Command name must start with a letter'
    );
    expect(() => validateCommandName('a'.repeat(51))).toThrow(
      'Command name must be 50 characters or less'
    );
  });
});

describe('CLI Commands - Command Handlers', () => {
  it('should return async functions for all command handlers', () => {
    const allCommands = getAllCommands();

    for (const command of allCommands) {
      expect(typeof command.handler).toBe('function');
      expect(command.handler.constructor.name).toBe('AsyncFunction');
    }
  });

  it('should have working command handlers (basic smoke test)', async () => {
    const mockContext = createMockContext();
    const allCommands = getAllCommands();

    // Test that handlers don't throw synchronously
    for (const command of allCommands) {
      const promise = command.handler(mockContext);
      expect(promise).toBeInstanceOf(Promise);
      // We don't await here as it might require DI setup
    }
  });
});

describe('CLI Commands - Default Registry', () => {
  it('should have default command registry initialized', () => {
    expect(_defaultCommandRegistry).toBeDefined();
    expect(_defaultCommandRegistry).toBeInstanceOf(TypeSafeCommandRegistry);
  });

  it('should have all expected commands in default registry', () => {
    const defaultCommands = _defaultCommandRegistry.getAll();
    const commandNames = defaultCommands.map((c) => c.name);

    expect(commandNames).toContain('help');
    expect(commandNames).toContain('version');
    expect(commandNames).toContain('convert');
    expect(commandNames).toContain('config');
  });

  it('should have commands object matching default registry', () => {
    const registryCommands = _defaultCommandRegistry.getAll();
    const objectCommands = Object.values(commands);

    expect(registryCommands).toHaveLength(objectCommands.length);

    const registryNames = registryCommands.map((c) => c.name).sort();
    const objectNames = objectCommands.map((c) => c.name).sort();

    expect(registryNames).toEqual(objectNames);
  });
});

describe('CLI Commands - Integration Tests', () => {
  it('should work together in typical usage scenarios', () => {
    // Scenario: Get all commands, find one, format help
    const allCommands = getAllCommands();
    const helpCommand = getCommand('help');
    const helpText = formatCommandHelp(helpCommand!);

    expect(allCommands.length).toBeGreaterThan(0);
    expect(helpCommand).toBeDefined();
    expect(helpText.length).toBeGreaterThan(0);
  });

  it('should handle command lookup and help formatting for all commands', () => {
    const allCommands = getAllCommands();

    for (const command of allCommands) {
      const foundCommand = getCommand(command.name);
      expect(foundCommand).toBeDefined();
      expect(foundCommand?.name).toBe(command.name);

      const helpText = formatCommandHelp(foundCommand!);
      expect(helpText.length).toBeGreaterThan(0);
      expect(helpText).toContain(command.name);
      expect(helpText).toContain(command.description);
    }
  });

  it('should maintain consistency between commands object and helper functions', () => {
    const commandsFromObject = Object.values(commands);
    const commandsFromGetAll = getAllCommands();

    expect(commandsFromObject).toHaveLength(commandsFromGetAll.length);

    const namesFromObject = commandsFromObject.map((c) => c.name).sort();
    const namesFromGetAll = commandsFromGetAll.map((c) => c.name).sort();

    expect(namesFromObject).toEqual(namesFromGetAll);
  });
});
