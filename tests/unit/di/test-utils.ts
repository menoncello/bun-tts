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
    versionCommand: asFunction(
      (cradle) => new VersionCommand(cradle.logger, cradle.outputWriter),
      {
        lifetime: Lifetime.TRANSIENT,
      }
    ),
    convertCommand: asFunction(
      (cradle) => new ConvertCommand(cradle.logger, cradle.configManager),
      { lifetime: Lifetime.TRANSIENT }
    ),
    configCommand: asFunction(
      (cradle) =>
        new ConfigCommand(
          cradle.logger,
          cradle.configManager,
          cradle.outputWriter
        ),
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

function createMockMethod(returnValue: any) {
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
    info: () => {
      // Intentionally empty mock for testing
    },
    debug: () => {
      // Intentionally empty mock for testing
    },
    warn: () => {
      // Intentionally empty mock for testing
    },
    error: () => {
      // Intentionally empty mock for testing
    },
    fatal: () => {
      // Intentionally empty mock for testing
    },
    child: () => pinoLogger,
  };

  return {
    info,
    debug,
    warn,
    error,
    fatal,
    child: createMockMethod(null), // Pass null initially to avoid circular reference
    withContext: createMockMethod(null),
    logOperation: createMockMethod(Promise.resolve()),
    logPerformance: debug,
    getPinoLogger: createMockMethod(pinoLogger),
    level: 'info',
    write,
  };
};

/**
 * Mock OutputWriter for testing
 */
export const createMockOutputWriter = () => {
  const write = createLoggingMethod();

  return {
    write,
    clear: () => write.mockClear(),
    getWrites: () => write.mockCalls(),
  };
};

/**
 * Mock ConfigManager for testing
 */
export const createMockConfigManager = () => {
  return {
    loadConfig: createMockMethod(
      Promise.resolve({ success: true, data: { sample: 'config' } })
    ),
    getConfig: createMockMethod({ sample: 'config' }),
    reloadConfig: createMockMethod(
      Promise.resolve({ success: true, data: { sample: 'config' } })
    ),
    createSampleConfig: createMockMethod('# Sample Config'),
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

  for (const key of Object.keys(registrations)) {
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
  }
};
