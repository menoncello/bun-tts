import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigManager } from '../../../src/config';
import {
  container,
  resolve,
  initializeContainer,
} from '../../../src/di/container';
import { DEPENDENCIES } from '../../../src/di/types';
import { Logger } from '../../../src/utils/logger';

describe('DI Container Singleton Dependencies', () => {
  it('should provide singleton ConfigManager', () => {
    const config1 = resolve<ConfigManager>(DEPENDENCIES.CONFIG_MANAGER);
    const config2 = resolve<ConfigManager>(DEPENDENCIES.CONFIG_MANAGER);

    expect(config1).toBeInstanceOf(ConfigManager);
    expect(config2).toBeInstanceOf(ConfigManager);
    expect(config1).toBe(config2); // Same instance (singleton)
  });

  it('should provide singleton Logger', () => {
    const logger1 = resolve<Logger>(DEPENDENCIES.LOGGER);
    const logger2 = resolve<Logger>(DEPENDENCIES.LOGGER);

    expect(logger1).toBeInstanceOf(Logger);
    expect(logger2).toBeInstanceOf(Logger);
    expect(logger1).toBe(logger2); // Same instance (singleton)
  });
});

describe('DI Container Transient Dependencies', () => {
  it('should provide transient HelpCommand', () => {
    const helpCommand1 = resolve(DEPENDENCIES.HELP_COMMAND);
    const helpCommand2 = resolve(DEPENDENCIES.HELP_COMMAND);

    expect(helpCommand1).toBeDefined();
    expect(helpCommand2).toBeDefined();
    expect(helpCommand1).not.toBe(helpCommand2); // Different instances (transient)
  });

  it('should provide transient VersionCommand', () => {
    const versionCommand1 = resolve(DEPENDENCIES.VERSION_COMMAND);
    const versionCommand2 = resolve(DEPENDENCIES.VERSION_COMMAND);

    expect(versionCommand1).toBeDefined();
    expect(versionCommand2).toBeDefined();
    expect(versionCommand1).not.toBe(versionCommand2); // Different instances (transient)
  });

  it('should provide transient ConvertCommand', () => {
    const convertCommand1 = resolve(DEPENDENCIES.CONVERT_COMMAND);
    const convertCommand2 = resolve(DEPENDENCIES.CONVERT_COMMAND);

    expect(convertCommand1).toBeDefined();
    expect(convertCommand2).toBeDefined();
    expect(convertCommand1).not.toBe(convertCommand2); // Different instances (transient)
  });

  it('should provide transient ConfigCommand', () => {
    const configCommand1 = resolve(DEPENDENCIES.CONFIG_COMMAND);
    const configCommand2 = resolve(DEPENDENCIES.CONFIG_COMMAND);

    expect(configCommand1).toBeDefined();
    expect(configCommand2).toBeDefined();
    expect(configCommand1).not.toBe(configCommand2); // Different instances (transient)
  });
});

describe('DI Container Dependency Injection', () => {
  it('should inject dependencies into ConvertCommand', () => {
    const convertCommand = resolve(DEPENDENCIES.CONVERT_COMMAND);

    expect(convertCommand).toBeDefined();
    expect(typeof (convertCommand as any).execute).toBe('function');
  });

  it('should inject dependencies into ConfigCommand', () => {
    const configCommand = resolve(DEPENDENCIES.CONFIG_COMMAND);

    expect(configCommand).toBeDefined();
    expect(typeof (configCommand as any).execute).toBe('function');
  });

  it('should inject Logger into HelpCommand', () => {
    const helpCommand = resolve(DEPENDENCIES.HELP_COMMAND);

    expect(helpCommand).toBeDefined();
    expect(typeof (helpCommand as any).execute).toBe('function');
  });

  it('should inject Logger into VersionCommand', () => {
    const versionCommand = resolve(DEPENDENCIES.VERSION_COMMAND);

    expect(versionCommand).toBeDefined();
    expect(typeof (versionCommand as any).execute).toBe('function');
  });
});

describe('DI Container Initialization', () => {
  it('should initialize container successfully', async () => {
    await expect(initializeContainer()).resolves.toBeUndefined();
  });

  it('should have all required dependencies registered', () => {
    const registeredDependencies = container.registrations;

    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.CONFIG_MANAGER);
    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.LOGGER);
    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.HELP_COMMAND);
    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.VERSION_COMMAND);
    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.CONVERT_COMMAND);
    expect(registeredDependencies).toHaveProperty(DEPENDENCIES.CONFIG_COMMAND);
  });
});

describe('DI Container Error Handling', () => {
  it('should throw error for unregistered dependency', () => {
    expect(() => {
      resolve('nonExistentDependency');
    }).toThrow();
  });

  it('should handle dependency resolution gracefully', () => {
    expect(() => {
      resolve(DEPENDENCIES.CONFIG_MANAGER);
      resolve(DEPENDENCIES.LOGGER);
      resolve(DEPENDENCIES.HELP_COMMAND);
      resolve(DEPENDENCIES.VERSION_COMMAND);
      resolve(DEPENDENCIES.CONVERT_COMMAND);
      resolve(DEPENDENCIES.CONFIG_COMMAND);
    }).not.toThrow();
  });
});
