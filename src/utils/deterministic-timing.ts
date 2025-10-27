/**
 * Deterministic Timing Utilities
 *
 * Provides deterministic timing alternatives to setTimeout for testing and production.
 * Replaces hard waits with immediate resolution or controlled timing mechanisms.
 */

/**
 * Default batch size for processing items in batches
 */
const DEFAULT_BATCH_SIZE = 10;

/**
 * Immediate resolution promise - replaces setTimeout(() => resolve(), 0)
 * Useful for microtask scheduling without artificial delays
 *
 * @returns A promise that resolves immediately
 */
export const immediate = (): Promise<void> => {
  return Promise.resolve();
};

/**
 * Deterministic tick - replaces setTimeout with controlled execution
 * In tests, this can be mocked to control timing precisely
 *
 * @returns A promise that resolves on the next microtask cycle
 */
export const tick = (): Promise<void> => {
  // Use setImmediate or Promise.resolve for immediate async execution
  // This provides microtask timing without hard waits
  if (typeof setImmediate !== 'undefined') {
    return new Promise((resolve) => setImmediate(resolve));
  }
  return Promise.resolve();
};

/**
 * Conditional delay - only delays in production, immediate in tests
 *
 * @param ms - Milliseconds to delay (only in production)
 * @param isTestEnvironment - Override test environment detection (default: auto-detect)
 * @returns A promise that resolves immediately in tests or after delay in production
 */
export const conditionalDelay = async (
  ms: number,
  isTestEnvironment?: boolean
): Promise<void> => {
  const inTest =
    isTestEnvironment ??
    (typeof process !== 'undefined' &&
      (process.env.NODE_ENV === 'test' || process.env.BUN_TEST === '1'));

  if (inTest) {
    // In tests, use immediate resolution to avoid hard waits
    return immediate();
  }

  // Only delay in production
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Batch processor - processes items in deterministic batches
 * Replaces setTimeout-based batching with controlled iteration
 *
 * @template T - Type of input items
 * @template R - Type of processed results
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param batchSize - Number of items to process in each batch (default: 10)
 * @returns Promise resolving to array of processed results
 */
export const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = DEFAULT_BATCH_SIZE
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Yield control between batches without hard waits
    await tick();
  }

  return results;
};

/**
 * Async semaphore - limits concurrent execution without hard waits
 */
export class AsyncSemaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  /**
   * Creates a new async semaphore with the specified number of permits
   *
   * @param permits - The maximum number of concurrent operations allowed
   */
  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquires a permit, waiting if none are currently available
   *
   * @returns A promise that resolves when a permit is acquired
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Releases a permit, allowing a waiting operation to proceed if one exists
   */
  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      if (resolve) {
        this.permits--;
        resolve();
      }
    }
  }

  /**
   * Executes a function while holding a permit, automatically releasing it
   *
   * @template T - Type of value returned by the function
   * @param fn - Async function to execute while holding a permit
   * @returns Promise resolving to the result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Test-time controller - allows tests to control timing precisely
 */
export class TestTimeController {
  private static instance: TestTimeController | null = null;
  private currentTime = 0;

  /**
   * Gets the singleton instance of TestTimeController
   *
   * @returns The singleton TestTimeController instance
   */
  static getInstance(): TestTimeController {
    if (!TestTimeController.instance) {
      TestTimeController.instance = new TestTimeController();
    }
    return TestTimeController.instance;
  }

  /**
   * Advances the simulated time by the specified amount
   *
   * @param ms - Milliseconds to advance the time
   */
  advanceTime(ms: number): void {
    this.currentTime += ms;
  }

  /**
   * Gets the current simulated time
   *
   * @returns Current time in milliseconds
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Resets the simulated time to zero
   */
  reset(): void {
    this.currentTime = 0;
  }

  /**
   * Waits for a tick using the deterministic tick function
   *
   * @returns A promise that resolves on the next microtask cycle
   */
  async waitForTick(): Promise<void> {
    await tick();
  }
}

/**
 * Production delay with logging - tracks delay usage for optimization
 *
 * @param ms - Milliseconds to delay
 * @param reason - Optional description of why the delay is needed
 * @returns A promise that resolves after the specified delay
 */
export const trackedDelay = async (
  ms: number,
  reason?: string
): Promise<void> => {
  const startTime = Date.now();

  if (reason && typeof console !== 'undefined') {
    console.debug(`Delaying ${ms}ms for: ${reason}`);
  }

  await new Promise((resolve) => setTimeout(resolve, ms));

  const actualDelay = Date.now() - startTime;
  if (
    reason &&
    typeof console !== 'undefined' &&
    actualDelay > ms + DEFAULT_BATCH_SIZE
  ) {
    console.warn(
      `Delay exceeded expected by ${actualDelay - ms}ms for: ${reason}`
    );
  }
};
