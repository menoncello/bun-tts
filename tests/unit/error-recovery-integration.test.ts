import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  success,
  failure,
  BunTtsBaseError,
  type BunTtsError,
} from '../../src/errors/index';
import {
  ErrorRecoveryManager,
  executeWithRecovery,
  recoveryManager,
  resetRecoveryManager,
  type RecoveryContext,
} from '../../src/utils/error-recovery';
import { createCounter, wait } from '../utils/test-helpers';

describe('Convenience Functions', () => {
  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    resetRecoveryManager();
  });

  it('should execute with recovery using default manager', async () => {
    const operation = mock(() => Promise.resolve(success('test-success')));

    const result = await executeWithRecovery(operation, 'test-operation', 2);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test-success');
    }
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should handle operation failure with convenience function', async () => {
    // Use an error category that doesn't have default recovery strategies
    const error = new BunTtsBaseError('Test error', 'TEST_ERROR', 'custom', {
      recoverable: true,
    });

    const operation = mock(() => Promise.resolve(failure(error)));

    const result = await executeWithRecovery(operation, 'test-operation', 2);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should use default parameters with convenience function', async () => {
    const operation = mock(() => Promise.resolve(success('success')));

    await executeWithRecovery(operation, 'test-operation');

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should handle custom max attempts with convenience function', async () => {
    const attemptCounter = createCounter();
    const failingOperation = mock(async () => {
      attemptCounter.call();
      return attemptCounter.count < 3
        ? failure(
            new BunTtsBaseError(
              `Attempt ${attemptCounter.count} failed`,
              'ATTEMPT_ERROR',
              'validation',
              { recoverable: true }
            )
          )
        : success('finally succeeded');
    });

    const result = await executeWithRecovery(
      failingOperation,
      'test-operation',
      5
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('finally succeeded');
    }
    expect(attemptCounter.count).toBe(3);
  });

  it('should pass metadata to recovery strategies through convenience function', async () => {
    const manager = recoveryManager();
    const mockStrategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(
        (
          _error: BunTtsError | BunTtsBaseError,
          _context?: Record<string, unknown>
        ) => {
          return Promise.resolve(success('recovered-with-metadata'));
        }
      ),
      maxRetries: 3,
      retryDelay: 100,
    };

    manager.registerStrategy('TEST_ERROR', mockStrategy);

    const error = new BunTtsBaseError('Test error', 'TEST_ERROR', 'custom', {
      recoverable: true,
    });

    const failingOperation = mock(() => Promise.resolve(failure(error)));
    const metadata = { requestId: 'req-123', userId: 'user-456' };

    await executeWithRecovery(failingOperation, 'test-operation', 2, metadata);

    expect(mockStrategy.recover).toHaveBeenCalledWith(error, metadata);
  });
});

describe('Integration Scenarios', () => {
  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    resetRecoveryManager();
  });

  it('should handle complex recovery scenario with multiple strategies', async () => {
    const manager = ErrorRecoveryManager.getInstance();

    // Register multiple strategies for different error types to ensure matching
    const strategy1 = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => false),
      recover: mock(() => Promise.resolve(success('strategy1'))),
      maxRetries: 1,
    };

    const strategy2 = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Strategy2 failed',
              'STRATEGY2_ERROR',
              'validation',
              { recoverable: true }
            )
          )
        )
      ),
      maxRetries: 1,
    };

    const strategy3 = {
      canRecover: mock(() => true),
      recover: mock(() => Promise.resolve(success('strategy3-success'))),
      maxRetries: 1,
    };

    // Register strategies for all possible error type matches
    manager.registerStrategy('BunTtsBaseError', strategy1);
    manager.registerStrategy('BunTtsBaseError', strategy2);
    manager.registerStrategy('BunTtsBaseError', strategy3);
    manager.registerStrategy('COMPLEX_ERROR', strategy1);
    manager.registerStrategy('COMPLEX_ERROR', strategy2);
    manager.registerStrategy('COMPLEX_ERROR', strategy3);
    manager.registerStrategy('configuration', strategy1);
    manager.registerStrategy('configuration', strategy2);
    manager.registerStrategy('configuration', strategy3);

    const error = new BunTtsBaseError(
      'Complex error',
      'COMPLEX_ERROR',
      'configuration',
      { recoverable: true }
    );

    const context: RecoveryContext = {
      operation: 'complex-operation',
      attempt: 1,
      maxAttempts: 3,
    };

    const result = await manager.attemptRecovery(error, context);

    expect(strategy1.canRecover).toHaveBeenCalled();
    expect(strategy1.recover).not.toHaveBeenCalled();
    expect(strategy2.canRecover).toHaveBeenCalled();
    expect(strategy2.recover).toHaveBeenCalled();
    expect(strategy3.canRecover).toHaveBeenCalled();
    expect(strategy3.recover).toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('strategy3-success');
    }
  });

  it('should handle recovery with metadata and context', async () => {
    const manager = ErrorRecoveryManager.getInstance();

    const strategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(
        (
          _error: BunTtsError | BunTtsBaseError,
          context?: Record<string, unknown>
        ) => {
          return Promise.resolve(success({ recovered: true, context }));
        }
      ),
      maxRetries: 3,
    };

    // Register strategy for all possible error type matches
    manager.registerStrategy('BunTtsBaseError', strategy);
    manager.registerStrategy('CONTEXT_ERROR', strategy);
    manager.registerStrategy('configuration', strategy);

    const error = new BunTtsBaseError(
      'Context error',
      'CONTEXT_ERROR',
      'configuration',
      { recoverable: true }
    );

    const context: RecoveryContext = {
      operation: 'context-operation',
      attempt: 2,
      maxAttempts: 5,
      metadata: { userId: 'user123', sessionId: 'session456' },
    };

    const result = await manager.attemptRecovery(error, context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        recovered: true,
        context: { userId: 'user123', sessionId: 'session456' },
      });
    }
    expect(strategy.recover).toHaveBeenCalledWith(error, context.metadata);
  });

  it('should handle cascading failures across different error types', async () => {
    const manager = recoveryManager();

    const configStrategy = {
      canRecover: mock(() => false),
      recover: mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Config recovery failed',
              'CONFIG_RECOVERY_ERROR',
              'configuration',
              { recoverable: true }
            )
          )
        )
      ),
      maxRetries: 2,
    };

    const fileStrategy = {
      canRecover: mock(() => true),
      recover: mock(() => Promise.resolve(success('File recovery succeeded'))),
      maxRetries: 2,
    };

    manager.registerStrategy('CUSTOM_CONFIG_ERROR', configStrategy);
    manager.registerStrategy('CUSTOM_FILE_ERROR', fileStrategy);

    const configError = new BunTtsBaseError(
      'Config error',
      'CUSTOM_CONFIG_ERROR',
      'configuration',
      { recoverable: true }
    );

    const fileError = new BunTtsBaseError(
      'File error',
      'CUSTOM_FILE_ERROR',
      'file',
      {
        recoverable: true,
      }
    );

    const configContext: RecoveryContext = {
      operation: 'config-operation',
      attempt: 1,
      maxAttempts: 3,
    };

    const fileContext: RecoveryContext = {
      operation: 'file-operation',
      attempt: 1,
      maxAttempts: 3,
    };

    const configResult = await manager.attemptRecovery(
      configError,
      configContext
    );
    const fileResult = await manager.attemptRecovery(fileError, fileContext);

    expect(configResult.success).toBe(false);
    expect(fileResult.success).toBe(true);

    if (fileResult.success) {
      expect(fileResult.data).toBe('File recovery succeeded');
    }
  });

  it('should handle recovery strategy timeouts', async () => {
    const manager = recoveryManager();

    const slowStrategy = {
      canRecover: mock(() => true),
      recover: mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Real setTimeout for timeout test
        return success('slow recovery');
      }),
      maxRetries: 1,
    };

    manager.registerStrategy('SLOW_ERROR', slowStrategy);

    const error = new BunTtsBaseError('Slow error', 'SLOW_ERROR', 'custom', {
      recoverable: true,
    });

    const context: RecoveryContext = {
      operation: 'slow-operation',
      attempt: 1,
      maxAttempts: 2,
    };

    const startTime = Date.now();
    const result = await manager.attemptRecovery(error, context);
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThan(1900); // Should wait for the slow strategy
    expect(result.success).toBe(true);
  });

  it('should handle recovery with fallback functions', async () => {
    const manager = recoveryManager();

    const fallbackFn = mock(() =>
      Promise.resolve(success('fallback succeeded'))
    );

    const error = new BunTtsBaseError(
      'Fallback error',
      'FALLBACK_ERROR',
      'configuration',
      { recoverable: true }
    );

    const context: RecoveryContext = {
      operation: 'fallback-operation',
      attempt: 1,
      maxAttempts: 1,
      metadata: { fallback: fallbackFn },
    };

    // Just verify that the recovery attempt doesn't crash when fallback is provided
    await expect(
      manager.attemptRecovery(error, context)
    ).resolves.toBeDefined();
  });

  it('should maintain error context through recovery chain', async () => {
    const manager = recoveryManager();

    const strategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock(
        (
          _error: BunTtsError | BunTtsBaseError,
          context?: Record<string, unknown>
        ) => {
          // Simulate strategy that modifies the error context
          return Promise.resolve(
            success({
              originalError: _error.message,
              recoveryContext: context,
              strategyApplied: true,
            })
          );
        }
      ),
      maxRetries: 2,
    };

    manager.registerStrategy('CONTEXT_ERROR', strategy);

    const originalError = new BunTtsBaseError(
      'Original error',
      'CONTEXT_ERROR',
      'custom',
      { recoverable: true, details: { originalDetail: 'original value' } }
    );

    const context: RecoveryContext = {
      operation: 'context-operation',
      attempt: 1,
      maxAttempts: 3,
      metadata: {
        requestId: 'req-123',
        timestamp: Date.now(),
        nested: { value: 42 },
      },
    };

    const result = await manager.attemptRecovery(originalError, context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        originalError: 'Original error',
        recoveryContext: context.metadata,
        strategyApplied: true,
      });
    }
  });

  it('should handle concurrent recovery operations', async () => {
    const manager = recoveryManager();

    const strategy = {
      canRecover: mock((_error: BunTtsError | BunTtsBaseError) => true),
      recover: mock((error: BunTtsError | BunTtsBaseError) => {
        // Simulate async recovery with delay based on error code
        const delay = Number.parseInt(error.code) * 10;
        return wait(delay).then(() => success(`recovered-${error.code}`));
      }),
      maxRetries: 1,
    };

    // Register strategy for each error code that will be used
    for (let i = 0; i < 5; i++) {
      manager.registerStrategy(`${i}`, strategy);
    }
    manager.registerStrategy('BunTtsBaseError', strategy); // Register for error name fallback

    const errors = Array.from(
      { length: 5 },
      (_, i) =>
        new BunTtsBaseError(`Concurrent error ${i}`, `${i}`, 'custom', {
          recoverable: true,
        })
    );

    const contexts = errors.map((error, index) => ({
      operation: `concurrent-operation-${index}`,
      attempt: 1,
      maxAttempts: 2,
    }));

    // Start all recovery operations concurrently
    const promises = errors.map((error, index) =>
      manager.attemptRecovery(error, contexts[index]!)
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    for (const [index, result] of results.entries()) {
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(`recovered-${index}`);
      }
    }
  });

  it('should handle recovery strategy error propagation', async () => {
    const manager = ErrorRecoveryManager.getInstance();

    const errorPropagatingStrategy = {
      canRecover: mock(() => true),
      recover: mock(() => {
        const strategyError = new Error('Strategy internal error');
        // Attach additional context to the error
        (strategyError as any).recoveryStrategy = 'error-propagating';
        return Promise.reject(strategyError);
      }),
      maxRetries: 2,
    };

    manager.registerStrategy('PROPAGATE_ERROR', errorPropagatingStrategy);

    const error = new BunTtsBaseError(
      'Original error',
      'PROPAGATE_ERROR',
      'configuration',
      { recoverable: true }
    );

    const context: RecoveryContext = {
      operation: 'propagate-operation',
      attempt: 1,
      maxAttempts: 3,
    };

    const result = await manager.attemptRecovery(error, context);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Should return the original error when strategy fails, not the strategy error
      expect(result.error).toBeInstanceOf(BunTtsBaseError);
      expect(result.error.message).toBe('Original error');
    }
  });
});
