import {
  createContainer,
  Lifetime,
  asClass,
  asFunction,
  AwilixContainer,
} from 'awilix';
import { ConfigCommand } from '../cli/commands/config-command.js';
import { ConvertCommand } from '../cli/commands/convert-command.js';
import { HelpCommand, ConsoleOutputWriter } from '../cli/commands/help-command.js';
import { VersionCommand } from '../cli/commands/version-command.js';
import { ConfigManager } from '../config/index.js';
import { Logger } from '../utils/logger.js';

/**
 * Dependency Injection Container Configuration
 *
 * This container manages all application dependencies and their lifecycles.
 * Singletons are managed properly instead of manual singleton patterns.
 */

export const container: AwilixContainer = createContainer();

/**
 * Register Core Dependencies
 * These are the current working dependencies that exist in the project
 */

// Configuration and Logging - SINGLETON for shared state
container.register({
  configManager: asClass(ConfigManager, { lifetime: Lifetime.SINGLETON }),
  logger: asFunction(
    () => {
      // In test environment, ensure logger is created without worker threads
      // Always pass verbose=false in tests to minimize potential issues
      return new Logger(false);
    },
    { lifetime: Lifetime.SINGLETON }
  ),
});

// Output Services - SINGLETON for shared console access
container.register({
  outputWriter: asClass(ConsoleOutputWriter, { lifetime: Lifetime.SINGLETON }),
});

// CLI Commands - TRANSIENT for command execution with proper dependency injection
container.register({
  helpCommand: asFunction((cradle) => new HelpCommand(cradle.logger, cradle.outputWriter), {
    lifetime: Lifetime.TRANSIENT,
  }),
  versionCommand: asFunction((cradle) => new VersionCommand(cradle.logger), {
    lifetime: Lifetime.TRANSIENT,
  }),
  convertCommand: asFunction(
    (cradle) => new ConvertCommand(cradle.logger, cradle.configManager),
    { lifetime: Lifetime.TRANSIENT }
  ),
  configCommand: asFunction(
    (cradle) => new ConfigCommand(cradle.logger, cradle.configManager),
    { lifetime: Lifetime.TRANSIENT }
  ),
});

/**
 * Future Dependencies Registration
 * These will be registered as the respective modules are implemented
 *
 * The following modules will be registered as they are created:
 *
 * // TTS Adapter Factory - SINGLETON for adapter management
 * // ttsAdapterFactory: asFunction(TTSAdapterFactory, { lifetime: Lifetime.SINGLETON }),
 *
 * // Document Parsers - TRANSIENT (stateless, per-document parsing)
 * markdownParser: asClass(MarkdownParser, { lifetime: Lifetime.TRANSIENT }),
 * pdfParser: asClass(PDFParser, { lifetime: Lifetime.TRANSIENT }),
 * epubParser: asClass(EPUBParser, { lifetime: Lifetime.TRANSIENT }),
 *
 * // Core Services - TRANSIENT for request-based operations
 * documentProcessor: asClass(DocumentProcessor, { lifetime: Lifetime.TRANSIENT }),
 * audioProcessor: asClass(AudioProcessor, { lifetime: Lifetime.TRANSIENT }),
 *
 * // CLI Components - TRANSIENT for command execution
 * convertCommand: asClass(ConvertCommand, { lifetime: Lifetime.TRANSIENT }),
 * configCommand: asClass(ConfigCommand, { lifetime: Lifetime.TRANSIENT })
 */

/**
 * Dynamic Registration Function for Future Modules
 *
 * This allows modules to register themselves as they're implemented.
 * Provides a flexible way to extend the DI container with new services.
 *
 * @param {string} name - The name to register the module under
 * @param {new (...args: any[]) => any} factory - The constructor function for the module
 * @param {Record<string, unknown>} options - Registration options including lifetime
 * @returns {void} This function does not return a value
 *
 * @example
 * ```typescript
 * registerModule('myService', MyServiceClass, { lifetime: Lifetime.SINGLETON });
 * ```
 */
export const registerModule = (
  name: string,
  factory: new (...args: unknown[]) => unknown,
  options: Record<string, unknown> = {}
): void => {
  const lifetime = (options.lifetime as keyof typeof Lifetime) || Lifetime.TRANSIENT;
  container.register(name, asClass(factory, { lifetime }));
};

/**
 * Export convenience functions for dependency resolution
 *
 * Resolves a dependency from the DI container by name.
 * Provides type-safe access to registered services.
 *
 * @param {string} name - The name of the dependency to resolve
 * @returns {T} The resolved dependency instance
 * @template T The type of the dependency being resolved
 *
 * @example
 * ```typescript
 * const logger = resolve<Logger>('logger');
 * const config = resolve<ConfigManager>('configManager');
 * ```
 */
export const resolve = <T>(name: string): T => container.resolve(name) as T;

/**
 * Export container for testing and advanced usage
 */
export { container as diContainer };

/**
 * Initialize container with optional configuration
 *
 * This function serves as a placeholder for future initialization logic.
 * The container is already configured above, but this function provides
 * a consistent interface for any additional setup that may be needed.
 *
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 *
 * @example
 * ```typescript
 * await initializeContainer();
 * const logger = resolve<Logger>('logger');
 * ```
 */
export const initializeContainer = async (): Promise<void> => {
  // Container is initialized above, but this function can be used
  // for any additional setup logic in the future
  // Note: This returns void, not undefined
  return Promise.resolve();
};
