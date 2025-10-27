import {
  createContainer,
  Lifetime,
  asClass,
  asFunction,
  asValue,
  AwilixContainer,
} from 'awilix';
import { ConfigCommand } from '../../../src/cli/commands/config-command.js';
import { ConvertCommand } from '../../../src/cli/commands/convert-command.js';
import {
  HelpCommand,
  ConsoleOutputWriter,
} from '../../../src/cli/commands/help-command.js';
import { VersionCommand } from '../../../src/cli/commands/version-command.js';
import { ConfigManager } from '../../../src/config/index.js';
import { Logger as LoggerClass } from '../../../src/utils/logger.js';
import type { Logger } from '../../../src/interfaces/logger.js';

function createMockFunction() {
  const calls: any[] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];
  return fn;
}

function registerCoreDependencies(
  container: AwilixContainer,
  useMocks: boolean,
  mocks: any = {}
) {
  container.register({
    configManager: mocks.configManager
      ? asValue(mocks.configManager)
      : asClass(ConfigManager, { lifetime: Lifetime.SINGLETON }),

    logger: mocks.logger
      ? asValue(mocks.logger)
      : asFunction(() => new LoggerClass(useMocks), {
          lifetime: Lifetime.SINGLETON,
        }),

    outputWriter: mocks.outputWriter
      ? asValue(mocks.outputWriter)
      : asClass(ConsoleOutputWriter, { lifetime: Lifetime.SINGLETON }),
  });
}

function registerCommands(container: AwilixContainer) {
  container.register({
    helpCommand: asFunction(
      (cradle) => new HelpCommand(cradle.logger, cradle.outputWriter),
      {
        lifetime: Lifetime.TRANSIENT,
      }
    ),
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
}

/**
 * Creates a test DI container with real dependencies
 * Use this for integration tests
 */
export const createTestContainer = (): AwilixContainer => {
  const testContainer = createContainer();

  registerCoreDependencies(testContainer, false);
  registerCommands(testContainer);

  return testContainer;
};

/**
 * Creates a test DI container with mocked dependencies
 * Use this for unit tests
 */
export const createMockTestContainer = (
  mocks: {
    configManager?: any;
    logger?: any;
    outputWriter?: any;
  } = {}
): AwilixContainer => {
  const testContainer = createContainer();

  registerCoreDependencies(testContainer, true, mocks);
  registerCommands(testContainer);

  return testContainer;
};

function createLoggingMethod() {
  const calls: Array<[string, any?]> = [];
  const fn = (message: string, context?: any) => {
    calls.push([message, context]);
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];
  return fn;
}

function createWriteMethod() {
  const calls: Array<[unknown]> = [];
  const fn = (chunk: unknown) => {
    calls.push([chunk]);
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];
  return fn;
}

function createAdvancedMethod(returnValue: any) {
  const calls: any[] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return returnValue;
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];
  return fn;
}

/**
 * Mock Logger for testing
 */
export const createMockLogger = () => {
  // Create mock methods
  const info = createLoggingMethod();
  const debug = createLoggingMethod();
  const warn = createLoggingMethod();
  const error = createLoggingMethod();
  const fatal = createLoggingMethod();
  const write = createWriteMethod();

  // Create the mock logger object
  const pinoLogger = {
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    child: () => pinoLogger,
  };

  const mockLogger = {
    info,
    debug,
    warn,
    error,
    fatal,
    child: createAdvancedMethod(null), // Pass null initially to avoid circular reference
    withContext: createAdvancedMethod(null),
    logOperation: createAdvancedMethod(Promise.resolve()),
    logPerformance: debug,
    getPinoLogger: createAdvancedMethod(pinoLogger),
    level: 'info',
    write,
  };

  return mockLogger;
};

function createConfigMethod(returnValue: any) {
  const calls: any[] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return returnValue;
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];
  return fn;
}

/**
 * Mock ConfigManager for testing
 */
export const createMockConfigManager = () => {
  return {
    loadConfig: createConfigMethod(
      Promise.resolve({ success: true, data: { sample: 'config' } })
    ),
    getConfig: createConfigMethod({ sample: 'config' }),
    reloadConfig: createConfigMethod(
      Promise.resolve({ success: true, data: { sample: 'config' } })
    ),
    createSampleConfig: createConfigMethod('# Sample Config'),
  };
};

/**
 * Helper to resolve dependencies from test container
 */
export const resolveFromContainer = <T>(
  container: AwilixContainer,
  dependencyName: string
): T => {
  return container.resolve<T>(dependencyName);
};

/**
 * Test context builder for CLI commands
 */
export const createTestCliContext = (overrides: any = {}) => ({
  input: overrides.args || overrides.input || ['test.md'],
  flags: {
    verbose: false,
    config: undefined,
    help: false,
    version: false,
    ...overrides.flags,
  },
  logLevel: 'info',
  ...overrides,
});

/**
 * Reset all mocks in a container
 */
export const resetContainerMocks = (container: AwilixContainer): void => {
  const registrations = container.registrations;

  Object.keys(registrations).forEach((key) => {
    const registration = registrations[key];
    if (
      registration &&
      typeof registration === 'object' &&
      'value' in registration
    ) {
      const mock = (registration as any).value;
      if (mock && typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    }
  });
};
