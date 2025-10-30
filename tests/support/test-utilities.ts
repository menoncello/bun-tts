/**
 * Enhanced Test Utilities for Document Processing Tests
 *
 * Provides test cleanup patterns, priority classification, and enhanced isolation
 * for better test management and maintainability.
 */

import { describe, test, beforeEach, afterEach, mock } from 'bun:test';
import type { ConfigManager } from '../../src/config/config-manager.js';
import type { Logger } from '../../src/interfaces/logger.js';

/**
 * Test priority levels for classification and execution ordering
 */
export enum TestPriority {
  CRITICAL = 'critical', // Core functionality tests
  HIGH = 'high', // Important features
  MEDIUM = 'medium', // Standard features
  LOW = 'low', // Edge cases and nice-to-haves
  MAINTENANCE = 'maintenance', // Refactoring and cleanup tests
}

/**
 * Test metadata interface for enhanced test management
 */
export interface TestMetadata {
  priority: TestPriority;
  category: string;
  tags: string[];
  acceptanceCriteria?: string[];
  flaky?: boolean;
  slow?: boolean;
  requiresSetup?: boolean;
  cleanupRequired?: boolean;
}

/**
 * Test cleanup manager for proper test isolation
 */
export class TestCleanupManager {
  private static cleanupTasks: Array<() => Promise<void> | void> = [];
  private static mockInstances: any[] = [];

  /**
   * Register a cleanup task to be executed after each test
   * @param {() => Promise<void> | void} task - The cleanup task to register
   */
  static registerCleanup(task: () => Promise<void> | void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Register a mock instance for cleanup
   * @param {any} mockInstance - The mock instance to register for cleanup
   */
  static registerMock(mockInstance: any): void {
    this.mockInstances.push(mockInstance);
  }

  /**
   * Execute all cleanup tasks and reset mocks
   * @returns {Promise<void>} Promise that resolves when all cleanup tasks are complete
   */
  static async cleanup(): Promise<void> {
    // Reset all mocks
    for (const mockInstance of this.mockInstances) {
      if (mockInstance && typeof mockInstance.mockReset === 'function') {
        mockInstance.mockReset();
      }
    }

    // Execute cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch {
        // Silently handle cleanup task failures
      }
    }

    // Clear all registered items
    this.cleanupTasks = [];
    this.mockInstances = [];
  }

  /**
   * Clear all cleanup tasks without executing them
   */
  static clear(): void {
    this.cleanupTasks = [];
    this.mockInstances = [];
  }
}

/**
 * Enhanced mock factory with automatic cleanup registration
 */
export class EnhancedMockFactory {
  /**
   * Create a mock logger with automatic cleanup registration
   * @returns {Logger & { mock: ReturnType<typeof mock> }} A mock logger with tracking capabilities
   */
  static createLogger(): Logger & { mock: ReturnType<typeof mock> } {
    const logger = {
      debug: mock(() => {
        // Empty mock function for testing
      }),
      info: mock(() => {
        // Empty mock function for testing
      }),
      warn: mock(() => {
        // Empty mock function for testing
      }),
      error: mock(() => {
        // Empty mock function for testing
      }),
    } as any;

    // Register for automatic cleanup
    TestCleanupManager.registerMock(logger.debug);
    TestCleanupManager.registerMock(logger.info);
    TestCleanupManager.registerMock(logger.warn);
    TestCleanupManager.registerMock(logger.error);

    return logger;
  }

  /**
   * Create a mock config manager with automatic cleanup registration
   * @param {any} defaultConfig - Optional default configuration to return
   * @returns {ConfigManager & { mock: ReturnType<typeof mock> }} A mock config manager with tracking capabilities
   */
  static createConfigManager(
    defaultConfig?: any
  ): ConfigManager & { mock: ReturnType<typeof mock> } {
    const configManager = {
      get: mock((key: string, defaultValue: unknown) => {
        if (key === 'markdownParser' && defaultConfig) {
          return defaultConfig;
        }
        return defaultValue;
      }),
      set: mock(() => {
        // Empty mock function for testing
      }),
      has: mock(() => true),
      clear: mock(() => {
        // Empty mock function for testing
      }),
    } as any;

    // Register for automatic cleanup
    TestCleanupManager.registerMock(configManager.get);
    TestCleanupManager.registerMock(configManager.set);
    TestCleanupManager.registerMock(configManager.has);
    TestCleanupManager.registerMock(configManager.clear);

    return configManager;
  }
}

/**
 * Test classification utilities
 */
export class TestClassifier {
  /**
   * Classify a test based on its metadata
   * @param {TestMetadata} metadata - The test metadata to classify
   * @returns {{
     priority: TestPriority;
     shouldRunInCI: boolean;
     estimatedDuration: 'fast' | 'medium' | 'slow';
     requirements: string[];
   }} Object containing classification information
   */
  static classify(metadata: TestMetadata): {
    priority: TestPriority;
    shouldRunInCI: boolean;
    estimatedDuration: 'fast' | 'medium' | 'slow';
    requirements: string[];
  } {
    const shouldRunInCI = metadata.priority !== TestPriority.MAINTENANCE;

    let estimatedDuration: 'fast' | 'medium' | 'slow';
    if (metadata.slow) {
      estimatedDuration = 'slow';
    } else if (metadata.priority === TestPriority.CRITICAL) {
      estimatedDuration = 'fast';
    } else {
      estimatedDuration = 'medium';
    }

    const requirements: string[] = [];
    if (metadata.requiresSetup) requirements.push('setup');
    if (metadata.cleanupRequired) requirements.push('cleanup');
    if (metadata.flaky) requirements.push('retry');

    return {
      priority: metadata.priority,
      shouldRunInCI,
      estimatedDuration,
      requirements,
    };
  }

  /**
   * Generate test description with metadata
   * @param {string} baseDescription - The base description for the test
   * @param {Partial<TestMetadata>} metadata - Partial test metadata to include in the description
   * @returns {string} Formatted test description with priority and tags
   */
  static describeTest(
    baseDescription: string,
    metadata: Partial<TestMetadata>
  ): string {
    const priority = metadata.priority || TestPriority.MEDIUM;
    const tags = metadata.tags || [];

    const prefix = `[${priority.toUpperCase()}]`;
    const tagString = tags.length > 0 ? ` (${tags.join(', ')})` : '';

    return `${prefix} ${baseDescription}${tagString}`;
  }
}

/**
 * Enhanced test patterns with cleanup and metadata
 */
export class EnhancedTestPatterns {
  /**
   * Create a test with automatic cleanup and metadata
   */
  static createTest(
    description: string,
    testFn: () => Promise<void> | void,
    metadata: Partial<TestMetadata> = {}
  ): void {
    const fullDescription = TestClassifier.describeTest(description, metadata);

    test(fullDescription, async () => {
      try {
        await testFn();
      } finally {
        await TestCleanupManager.cleanup();
      }
    });
  }

  /**
   * Create a describe block with automatic cleanup for all tests
   */
  static createDescribe(
    description: string,
    testDefinitions: () => void,
    metadata: Partial<TestMetadata> = {}
  ): void {
    const fullDescription = TestClassifier.describeTest(description, metadata);

    describe(fullDescription, () => {
      beforeEach(() => {
        TestCleanupManager.clear();
      });

      afterEach(async () => {
        await TestCleanupManager.cleanup();
      });

      testDefinitions();
    });
  }

  /**
   * Skip test based on priority and environment
   */
  static conditionalTest(
    description: string,
    testFn: () => Promise<void> | void,
    metadata: Partial<TestMetadata>,
    environment: { ci: boolean; fastOnly: boolean } = {
      ci: false,
      fastOnly: false,
    }
  ): void {
    const classification = TestClassifier.classify(metadata as TestMetadata);

    // Skip in CI if maintenance test
    if (environment.ci && !classification.shouldRunInCI) {
      test.skip(description, testFn);
      return;
    }

    // Skip if fast only and test is slow
    if (environment.fastOnly && classification.estimatedDuration === 'slow') {
      test.skip(description, testFn);
      return;
    }

    this.createTest(description, testFn, metadata);
  }
}

/**
 * Test performance monitoring utilities
 */
export class TestPerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  /**
   * Start measuring test execution time
   */
  static startMeasurement(testName: string): () => number {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      if (!this.measurements.has(testName)) {
        this.measurements.set(testName, []);
      }

      this.measurements.get(testName)!.push(duration);
      return duration;
    };
  }

  /**
   * Get performance statistics for a test
   */
  static getStats(testName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
  } | null {
    const measurements = this.measurements.get(testName);

    if (!measurements || measurements.length === 0) {
      return null;
    }

    return {
      count: measurements.length,
      average:
        measurements.reduce((sum, time) => sum + time, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
    };
  }

  /**
   * Clear all measurements
   */
  static clearMeasurements(): void {
    this.measurements.clear();
  }
}

/**
 * Common test metadata constants for consistency
 */
export const TestMetadata = {
  CRITICAL_PARSER: {
    priority: TestPriority.CRITICAL,
    category: 'parser',
    tags: ['core', 'parser'],
    acceptanceCriteria: ['1', '2', '6'],
  } as TestMetadata,

  HIGH_ERROR_HANDLING: {
    priority: TestPriority.HIGH,
    category: 'error-handling',
    tags: ['error', 'recovery'],
    acceptanceCriteria: ['4'],
  } as TestMetadata,

  MEDIUM_CONTENT_TYPES: {
    priority: TestPriority.MEDIUM,
    category: 'content-types',
    tags: ['content', 'markdown'],
    acceptanceCriteria: ['3'],
  } as TestMetadata,

  LOW_PERFORMANCE: {
    priority: TestPriority.LOW,
    category: 'performance',
    tags: ['performance', 'optimization'],
    slow: true,
    requiresSetup: true,
  } as TestMetadata,

  MAINTENANCE_REFACTORING: {
    priority: TestPriority.MAINTENANCE,
    category: 'maintenance',
    tags: ['refactoring', 'cleanup'],
  } as TestMetadata,
} as const;
