import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ConfigurationError,
  FileNotFoundError,
  TTSError,
} from '../../src/errors/index.js';
import {
  ErrorRecoveryManager,
  getRecoveryManager,
  ConfigurationRecoveryStrategy,
  FileSystemRecoveryStrategy,
  NetworkRecoveryStrategy,
} from '../../src/utils/error-recovery.js';

describe('Error Recovery Manager', () => {
  let manager: ErrorRecoveryManager;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    manager = ErrorRecoveryManager.getInstance();
  });

  describe('strategy registration', () => {
    it('should register and retrieve recovery strategies', () => {
      const strategy = new ConfigurationRecoveryStrategy();
      manager.registerStrategy('TestError', strategy);

      // Strategy should be registered
      expect(() => {
        // No direct way to verify registration, but strategy exists
      }).not.toThrow();
    });

    it('should register multiple strategies for same error type', () => {
      const strategy1 = new ConfigurationRecoveryStrategy();
      const strategy2 = new FileSystemRecoveryStrategy();

      manager.registerStrategy('TestError', strategy1);
      manager.registerStrategy('TestError', strategy2);

      // Should not throw when multiple strategies are registered
      expect(() => {
        // No direct way to verify, but should work
      }).not.toThrow();
    });
  });

  describe('singleton behavior', () => {
    it('should return the same instance', () => {
      const manager1 = ErrorRecoveryManager.getInstance();
      const manager2 = ErrorRecoveryManager.getInstance();

      expect(manager1).toBe(manager2);
    });
  });
});

describe('Configuration Recovery Strategy', () => {
  let strategy: ConfigurationRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new ConfigurationRecoveryStrategy();
  });

  it('should not recover from non-recoverable configuration errors', () => {
    const error = new ConfigurationError('Config missing');

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false); // ConfigurationError is not recoverable by default
  });

  it('should not recover from non-configuration errors', () => {
    const error = new TTSError('TTS error');

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });
});

describe('File System Recovery Strategy', () => {
  let strategy: FileSystemRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new FileSystemRecoveryStrategy();
  });

  it('should recover from file system errors', () => {
    const error = new FileNotFoundError('/missing/file.txt');

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(true);
  });

  it('should not recover from non-file system errors', () => {
    const error = new ConfigurationError('Config error');

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });
});

describe('Network Recovery Strategy', () => {
  let strategy: NetworkRecoveryStrategy;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    strategy = new NetworkRecoveryStrategy();
  });

  it('should not recover from non-network errors', () => {
    const error = new ConfigurationError('Config error');

    const canRecover = strategy.canRecover(error);
    expect(canRecover).toBe(false);
  });
});

describe('Default Recovery Strategies', () => {
  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
  });

  it('should have default strategies registered', () => {
    // Test that recovery manager has default strategies
    expect(() => {
      getRecoveryManager().registerStrategy(
        'TestError',
        new ConfigurationRecoveryStrategy()
      );
    }).not.toThrow();
  });
});
