import { describe, it, expect } from 'bun:test';
import {
  ConfigurationError,
  success,
  failure,
} from '../../src/errors/index.js';
import {
  getRecoveryManager,
  executeWithRecovery,
} from '../../src/utils/error-recovery.js';
import {
  setupErrorHandlingTests,
  createMultiStrategyError,
} from '../support/error-handling-test-utils.js';

function createStrategy1(): any {
  return new (class Strategy1 {
    canRecover(err: any) {
      return err.message.includes('Complex');
    }
    async recover() {
      throw new Error('Strategy 1 failed');
    }
  })();
}

function createStrategy2(): any {
  return new (class Strategy2 {
    canRecover(err: any) {
      return err.message.includes('config error');
    }
    async recover() {
      return success('strategy-2-success');
    }
  })();
}

function createMultiStrategySetup() {
  const error = createMultiStrategyError();
  const strategy1 = createStrategy1();
  const strategy2 = createStrategy2();
  return { error, strategy1, strategy2 };
}

function registerRecoveryStrategies(
  error: ConfigurationError,
  strategy1: any,
  strategy2: any
): void {
  getRecoveryManager().registerStrategy('ConfigurationError', strategy1);
  getRecoveryManager().registerStrategy('ConfigurationError', strategy2);
}

function createFailingOperationForMultiStrategy(
  error: ConfigurationError
): () => Promise<any> {
  return async () => {
    return failure(error);
  };
}

async function executeMultiStrategyRecovery(
  operation: () => Promise<any>
): Promise<any> {
  return executeWithRecovery(operation, 'multi-strategy-test', 2);
}

async function testMultiStrategyRecovery(
  error: ConfigurationError,
  strategy1: any,
  strategy2: any
): Promise<any> {
  registerRecoveryStrategies(error, strategy1, strategy2);
  const operation = createFailingOperationForMultiStrategy(error);
  return executeMultiStrategyRecovery(operation);
}

function validateMultiStrategyResult(result: any): void {
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toBe('strategy-2-success');
  }
}

describe('Multi-Strategy Error Recovery', () => {
  setupErrorHandlingTests();

  describe('error recovery with multiple strategies', () => {
    it('should try multiple recovery strategies in order', async () => {
      const { error, strategy1, strategy2 } = createMultiStrategySetup();
      const result = await testMultiStrategyRecovery(
        error,
        strategy1,
        strategy2
      );

      validateMultiStrategyResult(result);
    });
  });
});
