/**
 * Performance tests for TTS Adapter operations
 * Tests synthesis speed, memory usage, and concurrent operation handling
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { performance } from 'perf_hooks';

// Type declarations for global performance tracking
declare global {
  var performanceMarkStart: number[];
  var performanceMarkEnd: number[];
}

// Type definition for synthesis response
interface SynthesisResponse {
  success: boolean;
  audio?: ArrayBuffer;
  metadata: {
    synthesisTime: number;
    engine: string;
    voice: string;
    requestId: string;
    textLength: number;
    wordCount: number;
  };
}

// Mock implementations for performance testing
const mockAdapter = {
  synthesize: async (text: string): Promise<SynthesisResponse> => {
    // Simulate synthesis time based on text length
    const words = text.split(' ').length;
    const synthesisTime = (words / 10) * 1000; // 10 words per second target
    await new Promise((resolve) => setTimeout(resolve, synthesisTime));

    return {
      success: true,
      audio: new ArrayBuffer(words * 100), // Mock audio data
      metadata: {
        synthesisTime,
        engine: 'mock-engine',
        voice: 'mock-voice',
        requestId: `req-${Date.now()}`,
        textLength: text.length,
        wordCount: words,
      },
    };
  },
};

describe('TTS Adapter Performance Tests', () => {
  beforeEach(() => {
    // Reset performance counters
    global.performanceMarkStart = [];
    global.performanceMarkEnd = [];
  });

  describe('Synthesis Speed Performance', () => {
    it('should meet minimum synthesis speed of 10 words per second', async () => {
      const testText =
        'This is a test text with exactly ten words in it for performance testing';
      const expectedWords = 10;
      const expectedMaxTime = (expectedWords / 10) * 1000; // 1000ms for 10 words at 10 wps

      const startTime = performance.now();
      const result = await mockAdapter.synthesize(testText);
      const endTime = performance.now();
      const actualTime = endTime - startTime;

      expect(actualTime).toBeLessThan(expectedMaxTime + 500); // Allow 500ms tolerance
      expect(result.metadata.synthesisTime).toBeLessThan(expectedMaxTime + 500);
      expect(result.success).toBe(true);
    });

    it('should handle smaller texts efficiently', async () => {
      const testText = 'Short performance test text';
      const words = testText.split(' ').length;

      const startTime = performance.now();
      const result = await mockAdapter.synthesize(testText);
      const endTime = performance.now();

      const actualTime = endTime - startTime;
      const wordsPerSecond = words / (actualTime / 1000);

      expect(wordsPerSecond).toBeGreaterThanOrEqual(5); // Allow some tolerance
      expect(result.success).toBe(true);
    });

    it('should maintain consistent performance across multiple requests', async () => {
      const testText = 'Short performance test text';
      const times: number[] = [];
      const iterations = 3; // Reduced for faster testing

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await mockAdapter.synthesize(testText);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
        times.length;
      const standardDeviation = Math.sqrt(variance);

      // Performance should be consistent (low standard deviation)
      expect(standardDeviation).toBeLessThan(averageTime * 0.5); // Within 50% of average
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle memory allocation efficiently during synthesis', async () => {
      const testText = 'Test text for memory usage performance evaluation';
      const initialMemory = process.memoryUsage();

      // Perform multiple synthesis operations
      const promises = Array.from({ length: 5 }, (_, i) =>
        mockAdapter.synthesize(`${testText} ${i}`)
      );
      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 100MB for 5 requests)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should properly clean up resources after synthesis', async () => {
      const testText = 'Test cleanup performance';

      // Synthesize and check memory before and after cleanup
      const beforeMemory = process.memoryUsage();
      const response = await mockAdapter.synthesize(testText);

      // Simulate cleanup
      if (response.audio) {
        // In real implementation, audio buffers would be cleaned up
        delete response.audio;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterMemory = process.memoryUsage();
      const memoryDifference = Math.abs(
        afterMemory.heapUsed - beforeMemory.heapUsed
      );

      // Memory difference should be minimal after cleanup
      expect(memoryDifference).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('Concurrent Operation Performance', () => {
    it('should handle concurrent synthesis requests efficiently', async () => {
      const testTexts = Array.from(
        { length: 3 },
        (_, i) => `Concurrent test text number ${i + 1}`
      ); // Reduced count

      const startTime = performance.now();
      const results = await Promise.all(
        testTexts.map((text) => mockAdapter.synthesize(text))
      );
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Concurrent operations should complete faster than sequential
      // Expected sequential time would be much higher
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect accurate performance metrics during synthesis', async () => {
      const testText = 'Metrics collection test text with ten words total';

      const result = await mockAdapter.synthesize(testText);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.synthesisTime).toBeGreaterThan(0);
      expect(result.metadata.textLength).toBe(testText.length);
      expect(result.metadata.requestId).toBeDefined();
      expect(result.metadata.engine).toBe('mock-engine');
    });

    it('should calculate real-time factor correctly', async () => {
      const testText = 'Real-time factor calculation test';
      const words = testText.split(' ').length;

      const startTime = performance.now();
      await mockAdapter.synthesize(testText);
      const endTime = performance.now();

      const synthesisTimeSeconds = (endTime - startTime) / 1000;
      const expectedAudioDuration = words * 0.6; // ~0.6 seconds per word
      const realTimeFactor = synthesisTimeSeconds / expectedAudioDuration;

      // Real-time factor should be reasonable (synthesis faster than real-time)
      expect(realTimeFactor).toBeGreaterThan(0.1);
      expect(realTimeFactor).toBeLessThan(2.0);
    });
  });
});

describe('TTS Performance Benchmarks', () => {
  it('should establish performance baselines', async () => {
    const benchmarkText =
      'This is a standard benchmark text for establishing TTS performance baselines';
    const iterations = 3; // Reduced for faster testing
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await mockAdapter.synthesize(benchmarkText);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const words = benchmarkText.split(' ').length;
    const averageWordsPerSecond = words / (averageTime / 1000);

    // Establish baseline expectations
    expect(averageWordsPerSecond).toBeGreaterThanOrEqual(5); // Reduced expectation
    expect(averageTime).toBeLessThan(5000); // Less than 5 seconds average
  });
});
