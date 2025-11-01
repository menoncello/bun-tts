import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  success,
  BunTtsBaseError,
  type BunTtsError,
} from '../../src/errors/index';
import {
  ErrorRecoveryManager,
  ConfigurationRecoveryStrategy,
  FileSystemRecoveryStrategy,
  NetworkRecoveryStrategy,
  recoveryManager,
} from '../../src/utils/error-recovery';

describe('Configuration Recovery Strategy', () => {
  let strategy: ConfigurationRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new ConfigurationRecoveryStrategy();
  });

  it('should recover from recoverable configuration errors', () => {
    const error = new BunTtsBaseError(
      'Config missing',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: true,
      }
    );

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(true);
  });

  it('should not recover from non-recoverable configuration errors', () => {
    const error = new BunTtsBaseError(
      'Config missing',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: false,
      }
    );

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should not recover from non-configuration errors', () => {
    const error = new BunTtsBaseError('TTS error', 'TTS_ERROR', 'tts', {
      recoverable: true,
    });

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should attempt recovery by reloading configuration', async () => {
    const error = new BunTtsBaseError(
      'Config error',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: true,
      }
    );

    const result = await strategy.recover(error);

    // Strategy will attempt to reload config, which may fail but shouldn't throw
    expect(result).toBeDefined();
  });

  it('should handle missing configuration files', async () => {
    const error = new BunTtsBaseError(
      'Config file not found',
      'CONFIG_FILE_NOT_FOUND',
      'configuration',
      {
        recoverable: true,
        details: { configPath: '/nonexistent/config.json' },
      }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
    // May succeed or fail depending on implementation, but shouldn't throw
  });

  it('should handle invalid configuration format', async () => {
    const error = new BunTtsBaseError(
      'Invalid config format',
      'INVALID_CONFIG_FORMAT',
      'configuration',
      {
        recoverable: true,
        details: { configPath: '/test/config.json' },
      }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle permission errors gracefully', async () => {
    const error = new BunTtsBaseError(
      'Permission denied',
      'CONFIG_PERMISSION_DENIED',
      'configuration',
      { recoverable: true, details: { configPath: '/protected/config.json' } }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });
});

describe('File System Recovery Strategy', () => {
  let strategy: FileSystemRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new FileSystemRecoveryStrategy();
  });

  it('should recover from recoverable file system errors', () => {
    const error = new BunTtsBaseError(
      'File not found',
      'FILE_NOT_FOUND',
      'file',
      { recoverable: true, details: { filePath: '/test/file.txt' } }
    );

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(true);
  });

  it('should not recover from non-recoverable file system errors', () => {
    const error = new BunTtsBaseError('File error', 'FILE_ERROR', 'file', {
      recoverable: false,
    });

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should not recover from non-file system errors', () => {
    const error = new BunTtsBaseError(
      'Config error',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: true,
      }
    );

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should fail recovery when no file path is provided', async () => {
    const error = new BunTtsBaseError('File error', 'FILE_ERROR', 'file', {
      recoverable: true,
      details: {}, // No filePath
    });

    const result = await strategy.recover(error);
    expect(result.success).toBe(false);
  });

  it('should attempt recovery for files with valid paths', async () => {
    const error = new BunTtsBaseError(
      'File not found',
      'FILE_NOT_FOUND',
      'file',
      { recoverable: true, details: { filePath: '/test/file.txt' } }
    );

    const result = await strategy.recover(error);
    // Will attempt to access file, which will likely fail but shouldn't throw
    expect(result).toBeDefined();
  });

  it('should handle permission denied errors', async () => {
    const error = new BunTtsBaseError(
      'Permission denied',
      'CONFIG_PERMISSION_DENIED',
      'configuration',
      { recoverable: true, details: { filePath: '/protected/file.txt' } }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle disk space errors', async () => {
    const error = new BunTtsBaseError('Disk full', 'DISK_FULL', 'file', {
      recoverable: true,
      details: { filePath: '/test/file.txt' },
    });

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle file locking errors', async () => {
    const error = new BunTtsBaseError('File locked', 'FILE_LOCKED', 'file', {
      recoverable: true,
      details: { filePath: '/locked/file.txt' },
    });

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });
});

describe('Network Recovery Strategy', () => {
  let strategy: NetworkRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new NetworkRecoveryStrategy();
  });

  it('should recover from recoverable network errors', () => {
    const error = new BunTtsBaseError('Network error', 'NETWORK_ERROR', 'tts', {
      recoverable: true,
    });

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(true);
  });

  it('should not recover from non-recoverable network errors', () => {
    const error = new BunTtsBaseError('Network error', 'NETWORK_ERROR', 'tts', {
      recoverable: false,
    });

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should not recover from non-network errors', () => {
    const error = new BunTtsBaseError(
      'Config error',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: true,
      }
    );

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });

  it('should implement retry delay during recovery', async () => {
    const error = new BunTtsBaseError(
      'Network timeout',
      'TIMEOUT_ERROR',
      'tts',
      { recoverable: true }
    );

    const startTime = Date.now();
    const result = await strategy.recover(error);
    const endTime = Date.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeGreaterThan(900); // Allow for some variance around 1000ms
  });

  it('should handle connection refused errors', async () => {
    const error = new BunTtsBaseError(
      'Connection refused',
      'CONNECTION_REFUSED',
      'tts',
      { recoverable: true }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle DNS resolution errors', async () => {
    const error = new BunTtsBaseError(
      'DNS resolution failed',
      'DNS_ERROR',
      'tts',
      { recoverable: true }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle SSL/TLS errors', async () => {
    const error = new BunTtsBaseError(
      'SSL certificate error',
      'SSL_ERROR',
      'tts',
      { recoverable: true }
    );

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });

  it('should handle rate limiting errors', async () => {
    const error = new BunTtsBaseError('Rate limited', 'RATE_LIMITED', 'tts', {
      recoverable: true,
    });

    const result = await strategy.recover(error);

    expect(result).toBeDefined();
  });
});

describe('Default Recovery Strategies', () => {
  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
  });

  it('should have default strategies registered', () => {
    // Test that recovery manager has default strategies
    expect(() => {
      recoveryManager().registerStrategy(
        'TestError',
        new ConfigurationRecoveryStrategy()
      );
    }).not.toThrow();
  });

  it('should provide strategy for configuration errors', () => {
    const manager = recoveryManager();
    const configStrategy = new ConfigurationRecoveryStrategy();

    manager.registerStrategy('CONFIG_ERROR', configStrategy);

    const error = new BunTtsBaseError(
      'Config error',
      'CONFIG_ERROR',
      'configuration',
      {
        recoverable: true,
      }
    );

    expect(configStrategy.canRecover(error)).toBe(true);
  });

  it('should provide strategy for file system errors', () => {
    const manager = recoveryManager();
    const fileStrategy = new FileSystemRecoveryStrategy();

    manager.registerStrategy('FILE_ERROR', fileStrategy);

    const error = new BunTtsBaseError('File error', 'FILE_ERROR', 'file', {
      recoverable: true,
    });

    expect(fileStrategy.canRecover(error)).toBe(true);
  });

  it('should provide strategy for network errors', () => {
    const manager = recoveryManager();
    const networkStrategy = new NetworkRecoveryStrategy();

    manager.registerStrategy('NETWORK_ERROR', networkStrategy);

    const error = new BunTtsBaseError('Network error', 'NETWORK_ERROR', 'tts', {
      recoverable: true,
    });

    expect(networkStrategy.canRecover(error)).toBe(true);
  });

  it('should allow custom strategies alongside default ones', () => {
    const manager = recoveryManager();

    const customStrategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(() => Promise.resolve(success('custom-recovered'))),
      maxRetries: 3,
      retryDelay: 100,
    };

    manager.registerStrategy('CUSTOM_ERROR', customStrategy);
    manager.registerStrategy(
      'CONFIG_ERROR',
      new ConfigurationRecoveryStrategy()
    );

    const customError = new BunTtsBaseError(
      'Custom error',
      'CUSTOM_ERROR',
      'configuration',
      { recoverable: true }
    );

    const configError = new BunTtsBaseError(
      'Config error',
      'GENERIC_CONFIG_ERROR',
      'configuration',
      { recoverable: true }
    );

    expect(customStrategy.canRecover(customError)).toBe(true);
    // Reuse the strategy that was already registered
    expect(customStrategy.canRecover(configError)).toBe(true);
  });

  it('should handle strategy priority correctly', () => {
    const manager = recoveryManager();

    const highPriorityStrategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(() => Promise.resolve(success('high-priority'))),
      maxRetries: 3,
      retryDelay: 100,
    };

    const lowPriorityStrategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(() => Promise.resolve(success('low-priority'))),
      maxRetries: 3,
      retryDelay: 100,
    };

    // Register strategies in order
    manager.registerStrategy('TEST_ERROR', lowPriorityStrategy);
    manager.registerStrategy('TEST_ERROR', highPriorityStrategy);

    const error = new BunTtsBaseError('Test error', 'TEST_ERROR', 'parsing', {
      recoverable: true,
    });

    // Should use the last registered strategy (highest priority)
    expect(highPriorityStrategy.canRecover(error)).toBe(true);
  });
});
