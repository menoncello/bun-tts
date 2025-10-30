import { describe, it, expect, beforeEach } from 'bun:test';
import { DEPENDENCIES } from '../../../src/di/types.js';
import type { CliContext } from '../../../src/types/index.js';
import { createTestContainer, resolveFromContainer } from './test-utils.js';

describe('DI Integration Tests', () => {
  let _mockContext: CliContext;
  let testContainer: any;

  beforeEach(() => {
    _mockContext = {
      input: ['test.md'],
      flags: {
        verbose: false,
        config: undefined,
        help: false,
      },
      logLevel: 'info',
    };

    // Create fresh test container for each test
    testContainer = createTestContainer();
  });

  describe('Singleton Behavior', () => {
    it('should maintain singleton state across command executions', async () => {
      const configManager1 = resolveFromContainer(
        testContainer,
        DEPENDENCIES.CONFIG_MANAGER
      ) as any;
      const configManager2 = resolveFromContainer(
        testContainer,
        DEPENDENCIES.CONFIG_MANAGER
      ) as any;

      // Load config in first instance
      await configManager1.loadConfig();

      // Second instance should have same state
      expect(configManager1.getConfig()).toBe(configManager2.getConfig());
      expect(configManager1).toBe(configManager2);
    });
  });

  describe('Performance with DI', () => {
    it('should maintain performance with singleton reuse', () => {
      const configManager = resolveFromContainer(
        testContainer,
        DEPENDENCIES.CONFIG_MANAGER
      ) as any;
      const startTime = Date.now();

      // Multiple resolutions should return same instance quickly
      for (let i = 0; i < 1000; i++) {
        const instance = resolveFromContainer(
          testContainer,
          DEPENDENCIES.CONFIG_MANAGER
        ) as any;
        expect(instance).toBe(configManager);
      }

      const duration = Date.now() - startTime;

      // Should be very fast with singleton reuse
      expect(duration).toBeLessThan(50);
    });
  });
});
