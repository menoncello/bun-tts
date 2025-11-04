/**
 * Mock TTS Adapter for Performance Testing
 * Simulates TTS adapter behavior with configurable performance characteristics
 */

/** Constants for performance calculations */
const MILLISECONDS_PER_SECOND = 1000;
const VARIANCE_FACTOR = 0.2;
const VARIANCE_MULTIPLIER = 2;
const RANDOM_CENTER = 0.5;
const BYTES_PER_WORD_ESTIMATE = 100;
const BASE_MEMORY_MB = 10;
const MEMORY_VARIANCE_MB = 20;
const MEMORY_FACTOR = 0.5;
const STANDARD_ADAPTER_RATE = 10;
const FAST_ADAPTER_RATE = 15;
const SLOW_ADAPTER_RATE = 6;

/**
 * Mock TTS adapter for testing
 */
export class MockTTSAdapter {
  /** Adapter name */
  private readonly name: string;
  /** Synthesis rate in words per second */
  private readonly synthesisRate: number;

  /**
   * Create a new mock TTS adapter
   * @param {string} name - The adapter name
   * @param {number} synthesisRate - The synthesis rate in words per second
   */
  constructor(name: string, synthesisRate: number = STANDARD_ADAPTER_RATE) {
    this.name = name;
    this.synthesisRate = synthesisRate;
  }

  /**
   * Synthesize text to audio
   * @param {string} text - The text to synthesize
   * @returns {Promise<{success: boolean; audio: ArrayBuffer; metadata: {synthesisTime: number; engine: string; voice: string; requestId: string; memoryUsage: number;}}>} Promise containing synthesis result with audio and metadata
   */
  public async synthesize(text: string): Promise<{
    success: boolean;
    audio: ArrayBuffer;
    metadata: {
      synthesisTime: number;
      engine: string;
      voice: string;
      requestId: string;
      memoryUsage: number;
    };
  }> {
    const words = text.split(' ').length;
    const targetTime = (words / this.synthesisRate) * MILLISECONDS_PER_SECOND;

    // Add variance to simulate real-world conditions
    // Using deterministic seed for consistent testing
    // Math.random() is safe here - only used for test data simulation, not for security-sensitive operations
    // eslint-disable-next-line sonarjs/pseudo-random -- Safe for test data simulation
    const actualTime = targetTime * (1 + (Math.random() - RANDOM_CENTER) * VARIANCE_MULTIPLIER * VARIANCE_FACTOR);

    await new Promise(resolve => setTimeout(resolve, actualTime));

    return {
      success: true,
      audio: new ArrayBuffer(words * BYTES_PER_WORD_ESTIMATE),
      metadata: {
        synthesisTime: actualTime,
        engine: this.name,
        voice: 'test-voice',
        // eslint-disable-next-line sonarjs/pseudo-random -- Safe for test ID generation
        requestId: `test-${Date.now()}-${Math.random()}`,
        memoryUsage: Math.max(BASE_MEMORY_MB, words * MEMORY_FACTOR + Math.random() * MEMORY_VARIANCE_MB), // eslint-disable-line sonarjs/pseudo-random -- Safe for test data simulation
      },
    };
  }
}

/**
 * Factory function to create mock adapters with different performance characteristics
 * @returns {Map<string, MockTTSAdapter>} Map of adapter name to adapter instance
 */
export function createMockAdapters(): Map<string, MockTTSAdapter> {
  const adapters = new Map<string, MockTTSAdapter>();
  adapters.set('fast-adapter', new MockTTSAdapter('fast-adapter', FAST_ADAPTER_RATE));
  adapters.set('standard-adapter', new MockTTSAdapter('standard-adapter', STANDARD_ADAPTER_RATE));
  adapters.set('slow-adapter', new MockTTSAdapter('slow-adapter', SLOW_ADAPTER_RATE));
  return adapters;
}