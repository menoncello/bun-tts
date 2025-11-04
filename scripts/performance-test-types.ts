/**
 * Performance Test Types and Interfaces
 * Shared types for performance testing functionality
 */

/** Performance test configuration */
export interface PerformanceTestConfig {
  testTexts: Array<{
    name: string;
    text: string;
    category: 'short' | 'medium' | 'long';
  }>;
  iterations: number;
  concurrentRequests: number;
  targets: import('../src/core/tts/adapters/performance-targets.js').PerformanceTargets;
  outputFormat: 'json' | 'markdown';
  outputFile?: string;
}

/** Test result interface */
export interface TestResult {
  adapterName: string;
  testName: string;
  category: string;
  iterations: number;
  wordCount: number;
  results: {
    successCount: number;
    successRate: number;
    avgSynthesisTime: number;
    avgSynthesisRate: number;
    avgMemoryUsage: number;
    minSynthesisTime: number;
    maxSynthesisTime: number;
    stdDeviation: number;
  };
  meetsTargets: boolean;
  assessment: {
    synthesis: boolean;
    responseTime: boolean;
    memory: boolean;
    quality: boolean;
    meetsAll: boolean;
    details: string[];
  };
  issues: string[];
}

/** Test summary interface */
export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  testDate: string;
  targets: import('../src/core/tts/adapters/performance-targets.js').PerformanceTargets;
}

/** Complete test results interface */
export interface TestResults {
  summary: TestSummary;
  results: TestResult[];
  recommendations: string[];
}