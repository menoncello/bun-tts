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
import { ProfileManager } from '../../../src/config/profile-manager.js';
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

    profileManager: mocks.profileManager
      ? asValue(mocks.profileManager)
      : asClass(ProfileManager, { lifetime: Lifetime.SINGLETON }),

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
          cradle.profileManager,
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
    profileManager?: any;
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
 * Uses the actual ConfigManager class but with mocked methods to avoid file system operations
 */
export const createMockConfigManager = () => {
  const defaultConfig = {
    ttsEngine: 'kokoro',
    voiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      emotion: {
        enabled: false,
        engine: 'ai',
        intensity: 0.5,
      },
    },
    outputFormat: 'mp3',
    sampleRate: 22050,
    channels: 1,
    bitrate: 128,
  };

  // Create a mock that extends the ConfigManager class functionality
  return {
    // Use the actual class methods but override to avoid file system access
    loadConfig: createMockMethod(
      Promise.resolve({
        success: true,
        data: defaultConfig,
      })
    ),
    getConfig: createMockMethod(defaultConfig),
    reloadConfig: createMockMethod(
      Promise.resolve({
        success: true,
        data: defaultConfig,
      })
    ),
    createSampleConfig: createMockMethod(`# bun-tts Configuration File
# This file controls the default behavior of the bun-tts CLI tool

# TTS engine to use for audio generation
# Options: kokoro, chatterbox
ttsEngine: "kokoro"

# Voice settings for audio generation
voiceSettings:
  # Speech speed (0 to 3, where 1.0 is normal speed)
  speed: 1.0

  # Pitch adjustment (0 to 2, where 1.0 is normal pitch)
  pitch: 1.0

  # Volume level (0 to 2, where 1.0 is normal volume)
  volume: 1.0

  # Emotion settings (optional)
  emotion:
    # Enable emotion processing
    enabled: false

    # Emotion detection engine
    # Options: ai, rule-based
    engine: "ai"

    # Intensity of emotion expression (0 to 1)
    intensity: 0.5

# Audio output format
# Options: mp3, wav, m4a
outputFormat: "mp3"

# Audio sample rate in Hz
sampleRate: 22050

# Audio channels
# Options: 1 (mono), 2 (stereo)
channels: 1

# Audio bitrate in kbps (for compressed formats)
bitrate: 128`),

    // Additional methods that might be expected by tests
    get: createMockMethod(null),
    set: createMockMethod(null),
    has: createMockMethod(false),
    clear: createMockMethod(null),
    save: createMockMethod(Promise.resolve({ success: true, data: undefined })),

    // Cast to ConfigManager type to satisfy TypeScript
  } as unknown as ConfigManager;
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
