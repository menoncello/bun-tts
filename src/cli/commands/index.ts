import { resolve } from '../../di/container.js';
import { DEPENDENCIES, type DIContainer } from '../../di/types.js';
import type { CliContext } from '../../types/index.js';

/** Maximum allowed length for command names */
const MAX_COMMAND_NAME_LENGTH = 50;

/** Regular expression pattern for valid command names */
const COMMAND_NAME_PATTERN = /^[A-Za-z][\w-]*$/;

/**
 * Interface defining the structure of a CLI command.
 * Commands are registered in the command registry and provide
 * a consistent interface for CLI operations.
 */
export interface Command {
  /** Unique identifier for the command */
  name: string;
  /** Human-readable description of what the command does */
  description: string;
  /** Async function that executes the command logic */
  handler: (context: CliContext) => Promise<void>;
  /** Optional array of usage examples for the command */
  examples?: string[];
}

/**
 * Type-safe command registry interface that provides compile-time
 * guarantees for command registration and retrieval.
 */
export interface CommandRegistry {
  /** Map of command names to their command definitions */
  readonly commands: Record<string, Command>;
  /** Type-safe lookup for commands by name */
  get: (name: string) => Command | undefined;
  /** Returns all registered commands */
  getAll: () => Command[];
  /** Type-safe command registration */
  register: (command: Command) => void;
}

/**
 * Centralized command registry containing all available CLI commands.
 * Each command is defined with its name, description, handler function,
 * and optional usage examples. Commands are resolved through the DI
 * container to maintain proper dependency injection patterns.
 */
export const commands: Record<string, Command> = {
  help: {
    name: 'help',
    description: 'Show help message and usage information',
    handler: async (context) => {
      const helpCommand = resolve<DIContainer['helpCommand']>(DEPENDENCIES.HELP_COMMAND);
      await helpCommand.execute(context);
    },
    examples: ['bun-tts help', 'bun-tts --help'],
  },

  version: {
    name: 'version',
    description: 'Show version information',
    handler: async (context) => {
      const versionCommand = resolve<DIContainer['versionCommand']>(DEPENDENCIES.VERSION_COMMAND);
      await versionCommand.execute(context);
    },
    examples: ['bun-tts version', 'bun-tts --version', 'bun-tts -v'],
  },

  convert: {
    name: 'convert',
    description: 'Convert a document to audiobook format',
    handler: async (context) => {
      const convertCommand = resolve<DIContainer['convertCommand']>(DEPENDENCIES.CONVERT_COMMAND);
      await convertCommand.execute(context);
    },
    examples: [
      'bun-tts convert document.pdf',
      'bun-tts convert --config config.json document.epub',
      'bun-tts convert --verbose document.md',
    ],
  },

  config: {
    name: 'config',
    description: 'Manage configuration settings',
    handler: async (context) => {
      const configCommand = resolve<DIContainer['configCommand']>(DEPENDENCIES.CONFIG_COMMAND);
      await configCommand.execute(context);
    },
    examples: [
      'bun-tts config show',
      'bun-tts config sample',
      'bun-tts config validate --config config.json',
    ],
  },
};


/**
 * Formats a command's help information as a readable string.
 * Includes the command name, description, and any available usage examples.
 *
 * @param {Command} command - The command object to format help text for
 * @returns {string} Formatted help string containing command information and examples
 *
 * @example
 * ```typescript
 * const helpCommand = getCommand('help');
 * if (helpCommand) {
 *   const helpText = formatCommandHelp(helpCommand);
 *   console.log(helpText);
 * }
 * ```
 */
export function formatCommandHelp(command: Command): string {
  if (!command) {
    return 'Invalid command: command object is required';
  }

  let help = `${command.name} - ${command.description}\n`;

  if (command.examples && command.examples.length > 0) {
    help += '\nExamples:\n';
    for (const example of command.examples) {
      help += `  ${example}\n`;
    }
  }

  return help.trim();
}

/**
 * Type-safe command registry implementation that provides centralized
 * command management with validation and error handling.
 */
export class TypeSafeCommandRegistry implements CommandRegistry {
  private readonly _commands: Record<string, Command> = {};

  /**
   * Creates a new TypeSafeCommandRegistry instance.
   *
   * @param {Record<string, Command>} initialCommands - Optional initial commands to register
   */
  constructor(initialCommands?: Record<string, Command>) {
    if (initialCommands) {
      for (const [, command] of Object.entries(initialCommands)) {
        this.register(command);
      }
    }
  }

  /**
   * Gets the readonly commands registry.
   *
   * @returns {Readonly<Record<string, Command>>} Read-only copy of the commands registry
   */
  get commands(): Readonly<Record<string, Command>> {
    return { ...this._commands };
  }

  /**
   * Retrieves a command by name with validation.
   *
   * @param {string} name - The command name to retrieve
   * @returns {Command | undefined} The command if found, undefined otherwise
   */
  get(name: string): Command | undefined {
    if (!name || typeof name !== 'string') {
      return undefined;
    }

    const normalizedName = name.toLowerCase().trim();
    return this._commands[normalizedName];
  }

  /**
   * Returns all registered commands.
   *
   * @returns {Command[]} Array of all registered commands
   */
  getAll(): Command[] {
    return Object.values(this._commands);
  }

  /**
   * Registers a new command with validation.
   *
   * @param {Command} command - The command to register
   * @throws {Error} If command validation fails
   */
  register(command: Command): void {
    this.validateCommand(command);

    const normalizedName = command.name.toLowerCase().trim();

    if (this._commands[normalizedName]) {
      throw new Error(`Command '${command.name}' is already registered`);
    }

    this._commands[normalizedName] = { ...command };
  }

  /**
   * Validates a command object before registration.
   *
   * @param {Command} command - The command to validate
   * @throws {Error} If validation fails
   */
  private validateCommand(command: Command): void {
    if (!command) {
      throw new Error('Command object is required');
    }

    if (typeof command.name !== 'string' || !command.name.trim()) {
      throw new Error('Command name must be a non-empty string');
    }

    if (typeof command.description !== 'string' || !command.description.trim()) {
      throw new Error('Command description must be a non-empty string');
    }

    if (typeof command.handler !== 'function') {
      throw new TypeError('Command handler must be a function');
    }

    if (command.examples && (!Array.isArray(command.examples) ||
        !command.examples.every(example => typeof example === 'string'))) {
      throw new Error('Command examples must be an array of strings');
    }
  }
}

/**
 * Default command registry instance containing all available commands.
 * This is the main registry used throughout the application.
 */
export const defaultCommandRegistry = new TypeSafeCommandRegistry(commands);

/**
 * Validates command names and throws descriptive errors for invalid inputs.
 *
 * @param {string} name - The command name to validate
 * @throws {Error} If the command name is invalid
 */
export function validateCommandName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Command name must be a non-empty string');
  }

  if (name.trim().length === 0) {
    throw new Error('Command name cannot be empty or whitespace only');
  }

  if (name.length > MAX_COMMAND_NAME_LENGTH) {
    throw new Error(`Command name must be ${MAX_COMMAND_NAME_LENGTH} characters or less`);
  }

  if (!COMMAND_NAME_PATTERN.test(name)) {
    throw new Error('Command name must start with a letter and contain only letters, numbers, hyphens, and underscores');
  }
}

/**
 * Retrieves a command from the registry by name.
 * Performs case-insensitive lookup to support various command name formats.
 *
 * @param {string} name - The name of the command to retrieve (case-insensitive)
 * @returns {Command | undefined} The command definition if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const helpCommand = getCommand('help');
 * const convertCommand = getCommand('CONVERT'); // case-insensitive
 * ```
 */
export const getCommand = (name: string): Command | undefined => {
  if (!name || typeof name !== 'string') {
    return undefined;
  }

  const normalizedName = name.toLowerCase().trim();
  return commands[normalizedName];
};

/**
 * Retrieves all registered commands from the command registry.
 * Returns a shallow copy of all command definitions to prevent
 * accidental modification of the registry.
 *
 * @returns {Command[]} An array containing all registered command definitions
 *
 * @example
 * ```typescript
 * const allCommands = getAllCommands();
 * console.log(`Available commands: ${allCommands.length}`);
 * ```
 */
export const getAllCommands = (): Command[] => {
  return Object.values(commands);
};
