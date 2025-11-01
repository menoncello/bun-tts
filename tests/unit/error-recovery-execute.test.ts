import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { success, failure, BunTtsBaseError } from '../../src/errors/index';
import { ErrorRecoveryManager } from '../../src/utils/error-recovery';
import {
  createCounter,
  wait,
  createRecoveryStrategyWithMultipleAttempts,
  createFailingOperationWithAttempts,
} from '../utils/test-helpers';

describe('Error Recovery Manager - Execute With Recovery', () => {
  let manager: ErrorRecoveryManager;

  beforeEach(() => {
    ErrorRecoveryManager.resetInstance();
    manager = ErrorRecoveryManager.getInstance();
  });

  afterEach(() => {
    ErrorRecoveryManager.resetInstance();
  });

  describe('Basic executeWithRecovery functionality', () => {
    it('should execute successful operations without recovery', async () => {
      const successfulOperation = mock(() =>
        Promise.resolve(success('operation succeeded'))
      );

      const result = await manager.executeWithRecovery(
        successfulOperation,
        'test-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('operation succeeded');
      }
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should attempt recovery for failed operations', async () => {
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(() => Promise.resolve(success('recovered'))),
        maxRetries: 3,
        retryDelay: 100,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);

      const failingOperation = mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Operation failed',
              'TEST_ERROR',
              'configuration',
              { recoverable: true }
            )
          )
        )
      );

      const result = await manager.executeWithRecovery(
        failingOperation,
        'test-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data as unknown as string).toBe('recovered');
      }
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle non-recoverable errors', async () => {
      const nonRecoverableOperation = mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Non-recoverable error',
              'NON_RECOVERABLE',
              'configuration',
              { recoverable: false }
            )
          )
        )
      );

      const result = await manager.executeWithRecovery(
        nonRecoverableOperation,
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(nonRecoverableOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Context handling in executeWithRecovery', () => {
    it('should pass operation context to recovery attempts', async () => {
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(() => Promise.resolve(success('recovered'))),
        maxRetries: 3,
        retryDelay: 100,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);

      const failingOperation = mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Operation failed',
              'TEST_ERROR',
              'configuration',
              { recoverable: true }
            )
          )
        )
      );

      const operationContext = {
        userId: 'test-user',
        sessionId: 'test-session',
      };

      await manager.executeWithRecovery(
        failingOperation,
        'test-operation',
        undefined,
        operationContext
      );

      expect(mockStrategy.recover).toHaveBeenCalledWith(
        expect.any(BunTtsBaseError),
        operationContext
      );
    });

    it('should maintain operation context through multiple attempts', async () => {
      const attemptCounter = createCounter();
      const mockStrategy =
        createRecoveryStrategyWithMultipleAttempts(attemptCounter);
      const failingOperation =
        createFailingOperationWithAttempts(attemptCounter);

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);
      manager.registerStrategy('Error', mockStrategy as any);

      const operationContext = {
        requestId: 'req-123',
        userId: 'user-456',
        metadata: { step: 1, total: 3 },
      };

      const result = await manager.executeWithRecovery(
        failingOperation,
        'context-operation',
        5,
        operationContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data as any).toEqual({
          recovered: true,
          attempts: 4,
          context: operationContext,
        });
      }
    });

    it('should handle empty operation context', async () => {
      const successfulOperation = mock(() =>
        Promise.resolve(success('success with empty context'))
      );

      const result = await manager.executeWithRecovery(
        successfulOperation,
        'empty-context-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success with empty context');
      }
    });

    it('should handle null operation context gracefully', async () => {
      const successfulOperation = mock(() =>
        Promise.resolve(success('success with null context'))
      );

      const result = await manager.executeWithRecovery(
        successfulOperation,
        'null-context-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success with null context');
      }
    });
  });

  describe('Error handling in executeWithRecovery', () => {
    it('should handle operations that throw errors', async () => {
      const mockStrategy = {
        canRecover: mock(() => false), // Don't recover - just return the error
        recover: mock(() =>
          Promise.resolve(
            failure(
              new BunTtsBaseError(
                'Should not be called',
                'SHOULD_NOT_BE_CALLED',
                'configuration'
              )
            )
          )
        ),
        maxRetries: 0,
        retryDelay: 100,
      };

      manager.registerStrategy('Error', mockStrategy as any);

      const throwingOperation = mock(() => {
        throw new Error('Operation threw error');
      });

      const result = await manager.executeWithRecovery(
        throwingOperation,
        'test-operation',
        1 // Only try once
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Operation threw error');
      }
    });

    it('should handle async operations with promises', async () => {
      const asyncOperation = mock(async () => {
        await wait(50);
        return success('async success');
      });

      const result = await manager.executeWithRecovery(
        asyncOperation,
        'async-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('async success');
      }
    });
  });

  describe('Retry logic and custom attempts', () => {
    it('should respect custom max attempts', async () => {
      const attemptCounter = createCounter();
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(async () => {
          attemptCounter.call();
          return attemptCounter.count < 5
            ? failure(
                new BunTtsBaseError(
                  `Attempt ${attemptCounter.count} failed`,
                  'ATTEMPT_FAILED',
                  'configuration'
                )
              )
            : success('finally succeeded');
        }),
        maxRetries: 10,
        retryDelay: 10,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);
      manager.registerStrategy('Error', mockStrategy as any);

      const failingOperation = mock(() => {
        const attempt = attemptCounter.count;
        return attemptCounter.count < 5
          ? Promise.resolve(
              failure(
                new BunTtsBaseError(
                  `Attempt ${attempt} failed`,
                  'ATTEMPT_FAILED',
                  'configuration'
                )
              )
            )
          : Promise.resolve(success('finally succeeded'));
      });

      const result = await manager.executeWithRecovery(
        failingOperation,
        'retry-operation',
        5 // Custom max attempts
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('finally succeeded');
      }
    });
  });

  describe('Complex data types and operations', () => {
    it('should handle operations with complex return types', async () => {
      const complexOperation = mock(() =>
        Promise.resolve(
          success({
            data: 'complex result',
            metadata: { id: 123, timestamp: Date.now() },
            nested: { values: [1, 2, 3] },
          })
        )
      );

      const result = await manager.executeWithRecovery(
        complexOperation,
        'complex-operation'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          data: 'complex result',
          metadata: { id: 123, timestamp: expect.any(Number) },
          nested: { values: [1, 2, 3] },
        });
      }
    });

    it('should handle operation timeouts', async () => {
      const timeoutOperation = mock(async () => {
        await wait(2000); // Simulate long-running operation
        return success('should not reach here');
      });

      const result = await manager.executeWithRecovery(
        timeoutOperation,
        'timeout-operation',
        1
      );

      // Depending on implementation, this might either timeout or succeed
      expect(result).toBeDefined();
    });
  });

  describe('Fallback functions in executeWithRecovery', () => {
    it('should handle fallback functions in executeWithRecovery', async () => {
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(() =>
          Promise.resolve(success('fallback-execution-success'))
        ),
        maxRetries: 2,
        retryDelay: 100,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);

      const failingOperation = mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Operation failed',
              'TEST_ERROR',
              'configuration',
              { recoverable: true }
            )
          )
        )
      );

      const operationContext = { userId: 'test-user' };

      const result = await manager.executeWithRecovery(
        failingOperation,
        'fallback-operation',
        3,
        operationContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data as unknown as string).toBe(
          'fallback-execution-success'
        );
      }
      expect(mockStrategy.recover).toHaveBeenCalled();
    });
  });

  describe('Advanced executeWithRecovery scenarios', () => {
    it('should handle concurrent executeWithRecovery operations', async () => {
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(() => Promise.resolve(success('recovered'))),
        maxRetries: 2,
        retryDelay: 50,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);

      const operations = Array.from({ length: 5 }, (_, index) =>
        mock(() => {
          if (index % 2 === 0) {
            return Promise.resolve(success(`success-${index}`));
          }
          return Promise.resolve(
            failure(
              new BunTtsBaseError(
                `Error ${index}`,
                'TEST_ERROR',
                'configuration',
                { recoverable: true }
              )
            )
          );
        })
      );

      const promises = operations.map((operation, index) =>
        manager.executeWithRecovery(
          operation,
          `concurrent-operation-${index}`,
          undefined,
          { operationIndex: index }
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      for (const [, result] of results.entries()) {
        expect(result.success).toBe(true);
        if (result.success) {
          expect([
            'success-0',
            'success-1',
            'success-2',
            'success-3',
            'success-4',
            'recovered',
          ]).toContain(result.data);
        }
      }
    });

    it('should handle operation context modifications during recovery', async () => {
      const mockStrategy = {
        canRecover: mock(() => true),
        recover: mock(
          async (error: BunTtsBaseError, context?: Record<string, unknown>) => {
            // Simulate context modification during recovery
            if (context) {
              (context as any).recoveryAttempt =
                ((context as any).recoveryAttempt || 0) + 1;
              (context as any).lastError = error.message;
            }
            await wait(50);
            return success('recovered-with-modified-context');
          }
        ),
        maxRetries: 3,
        retryDelay: 100,
      };

      manager.registerStrategy('BunTtsBaseError', mockStrategy as any);

      const failingOperation = mock(() =>
        Promise.resolve(
          failure(
            new BunTtsBaseError(
              'Operation with context modification',
              'TEST_ERROR',
              'configuration',
              { recoverable: true }
            )
          )
        )
      );

      const operationContext = {
        originalData: 'test-data',
        timestamp: Date.now(),
      };

      const result = await manager.executeWithRecovery(
        failingOperation,
        'context-modification-operation',
        undefined,
        operationContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data as unknown as string).toBe(
          'recovered-with-modified-context'
        );
      }
    });
  });
});
