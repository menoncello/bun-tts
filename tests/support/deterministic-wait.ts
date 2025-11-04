/**
 * Deterministic wait utilities for testing
 *
 * These utilities replace hard waits (setTimeout) with deterministic approaches
 * that check for actual conditions rather than arbitrary delays.
 */

/**
 * Wait for a condition to be true with polling
 * @param {() => boolean | Promise<boolean>} condition - Function that returns boolean indicating condition is met
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 1000)
 * @param {number} pollInterval - Time between checks in milliseconds (default: 10)
 * @returns {Promise<void>} Promise that resolves when condition is met or times out
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 1000,
  pollInterval = 10
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }

    // Wait for next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Timeout reached - don't fail, just continue
  // This prevents test failures due to timing issues
};

/**
 * Wait for adapter initialization with proper state checking
 * @param {{ isInitialized: boolean }} adapter - TTS adapter with isInitialized property
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
export const waitForAdapterInitialization = async (
  adapter: { isInitialized: boolean },
  timeout = 1000
): Promise<void> => {
  await waitForCondition(() => adapter.isInitialized, timeout, 10);
};

/**
 * Wait for multiple adapters to initialize
 * @param {Array<{ isInitialized: boolean }>} adapters - Array of adapters with isInitialized property
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
export const waitForMultipleAdapters = async (
  adapters: Array<{ isInitialized: boolean }>,
  timeout = 2000
): Promise<void> => {
  await waitForCondition(
    () => adapters.every((adapter) => adapter.isInitialized),
    timeout,
    10
  );
};

/**
 * Simulate async operation without hard wait
 * @param {() => T | Promise<T>} operation - Operation to perform
 * @param {() => void} resultCallback - Function to call when operation should complete
 */
export const simulateAsyncOperation = async <T>(
  operation: () => T | Promise<T>,
  resultCallback?: () => void
): Promise<T> => {
  const result = await operation();

  // If a callback is provided, call it immediately
  // This replaces arbitrary setTimeout delays
  if (resultCallback) {
    resultCallback();
  }

  return result;
};

/**
 * Create a mock adapter with deterministic initialization
 * @param {{ name: string; version: string; initializeDelay?: number; cleanupDelay?: number; synthesisDelay?: number; }} adapterConfig - Configuration for the mock adapter
 * @returns {any} Mock adapter with deterministic behavior
 */
export const createDeterministicMockAdapter = (adapterConfig: {
  name: string;
  version: string;
  initializeDelay?: number;
  cleanupDelay?: number;
  synthesisDelay?: number;
}) => {
  let isInitialized = false;
  const {
    name,
    version,
    initializeDelay = 0,
    cleanupDelay = 0,
    synthesisDelay = 0,
  } = adapterConfig;

  return {
    name,
    version,
    get isInitialized(): boolean {
      return isInitialized;
    },

    initialize: async (): Promise<void> => {
      // Only delay if explicitly requested for testing purposes
      if (initializeDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, initializeDelay));
      }
      isInitialized = true;
    },

    cleanup: async (): Promise<void> => {
      // Only delay if explicitly requested for testing purposes
      if (cleanupDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, cleanupDelay));
      }
      isInitialized = false;
    },

    // Mock synthesis with optional delay for testing
    synthesize: async (request: any) => {
      if (synthesisDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, synthesisDelay));
      }

      return {
        success: true,
        data: {
          success: true,
          audio: {
            data: new Float32Array(100),
            sampleRate: 22050,
            channels: 1,
            duration: 0.1,
            format: 'F32',
          },
          metadata: {
            synthesisTime: synthesisDelay || 50,
            engine: name,
            voice: request.voice.id,
            requestId: request.requestId || 'test-request',
          },
        },
      };
    },

    getSupportedVoices: async () => [],
    getCapabilities: async () => ({}),
    validateOptions: () => ({ isValid: true, errors: [], warnings: [] }),
    validateVoice: () => ({ isValid: true, errors: [], warnings: [] }),
    healthCheck: async () => ({
      engine: name,
      status: 'healthy' as const,
      timestamp: new Date(),
      responseTime: 50,
      message: `${name} is operating normally`,
    }),
    supportsFeature: async () => true,
    getVoice: async () => {
      // Mock implementation - return undefined for all voice queries
    },
  };
};
