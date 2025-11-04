#!/usr/bin/env bun

/**
 * Performance Testing Script for TTS Adapter System
 * Validates performance targets and generates performance reports
 */

import { performanceMonitor } from '../src/core/tts/adapters/performance-monitor.js';
import {
  DEFAULT_PERFORMANCE_TARGETS,
  PerformanceCalculator,
} from '../src/core/tts/adapters/performance-targets.js';
import { MockTTSAdapter, createMockAdapters } from './performance-test-adapter.js';
import { shouldShowHelp, showHelp, parseCommandLineArguments } from './performance-test-cli.js';
import type {
  PerformanceTestConfig,
  TestResult,
  TestSummary,
  TestResults
} from './performance-test-types.js';
import {
  calculateStatistics,
  extractIssues,
  generateRecommendations,
  outputJsonResults,
  outputMarkdownResults
} from './performance-test-utils.js';

/** Constants */
const DEFAULT_ITERATIONS = 5;
const DEFAULT_CONCURRENT = 1;
const MOCK_QUALITY_SCORE = 0.8;
const ARGUMENT_START_INDEX = 2;
const PERCENT_MULTIPLIER = 100;

/**
 * Performance test runner
 */
class PerformanceTestRunner {
  private readonly config: PerformanceTestConfig;
  private readonly adapters: Map<string, MockTTSAdapter>;

  /**
   * Create a new performance test runner
   * @param {PerformanceTestConfig} config - The test configuration
   */
  constructor(config: PerformanceTestConfig) {
    this.config = config;
    this.adapters = createMockAdapters();
  }

  /**
   * Run the complete performance test suite
   * @returns {Promise<TestResults>} Promise containing complete test results
   */
  public async runTests(): Promise<TestResults> {
    this.logTestStart();

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    const results = await this.runAllAdapterTests();
    const summary = this.generateSummary(results);
    const recommendations = generateRecommendations(results);

    // Stop performance monitoring
    performanceMonitor.stopMonitoring();

    this.logTestSummary(summary);

    return {
      summary,
      results,
      recommendations,
    };
  }

  /**
   * Log test start message
   */
  private logTestStart(): void {
    // eslint-disable-next-line no-console
    console.log('🚀 Starting TTS Adapter Performance Tests...\n');
  }

  /**
   * Run all adapter tests
   * @returns {Promise<TestResult[]>} Promise containing test results
   */
  private async runAllAdapterTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const [adapterName, adapter] of this.adapters) {
      // eslint-disable-next-line no-console
      console.log(`\n📊 Testing adapter: ${adapterName}`);

      for (const testText of this.config.testTexts) {
        // eslint-disable-next-line no-console
        console.log(`  📝 Running test: ${testText.name} (${testText.category})`);

        const testResult = await this.runSingleAdapterTest(
          adapterName,
          adapter,
          testText,
          this.config.iterations
        );

        results.push(testResult);
        this.logTestResult(testResult);
      }
    }

    return results;
  }

  /**
   * Log test result
   * @param {TestResult} testResult - The test result to log
   */
  private logTestResult(testResult: TestResult): void {
    if (testResult.meetsTargets) {
      // eslint-disable-next-line no-console
      console.log('    ✅ PASSED - Targets met');
    } else {
      // eslint-disable-next-line no-console
      console.log('    ❌ FAILED - Targets not met');
      // eslint-disable-next-line no-console
      console.log(`    📋 Issues: ${testResult.issues.join(', ')}`);
    }
  }

  /**
   * Generate test summary
   * @param {TestResult[]} results - The test results
   * @returns {TestSummary} Test summary
   */
  private generateSummary(results: TestResult[]): TestSummary {
    const totalTests = results.length;
    const passedTests = results.filter(result => result.meetsTargets).length;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate: (passedTests / totalTests) * PERCENT_MULTIPLIER,
      testDate: new Date().toISOString(),
      targets: this.config.targets,
    };
  }

  /**
   * Log test summary
   * @param {TestSummary} summary - The test summary
   */
  private logTestSummary(summary: TestSummary): void {
    // eslint-disable-next-line no-console
    console.log('\n📈 Performance Test Summary:');
    // eslint-disable-next-line no-console
    console.log(`   Total Tests: ${summary.totalTests}`);
    // eslint-disable-next-line no-console
    console.log(`   Passed: ${summary.passedTests}`);
    // eslint-disable-next-line no-console
    console.log(`   Failed: ${summary.failedTests}`);
    // eslint-disable-next-line no-console
    console.log(`   Pass Rate: ${summary.passRate.toFixed(1)}%`);
  }

  /**
   * Run performance test for a single adapter and text
   * @param {string} adapterName - Name of the adapter
   * @param {MockTTSAdapter} adapter - The adapter instance
   * @param {object} testText - The test text configuration
   * @param {string} testText.name - Name of the test text
   * @param {string} testText.text - The test text content
   * @param {string} testText.category - Category of the test text (short, medium, long)
   * @param {number} iterations - Number of test iterations
   * @returns {Promise<TestResult>} Promise containing test result
   */
  private async runSingleAdapterTest(
    adapterName: string,
    adapter: MockTTSAdapter,
    testText: { name: string; text: string; category: string },
    iterations: number
  ): Promise<TestResult> {
    const wordCount = this.extractWordCount(testText.text);
    const testMetrics = await this.runTestIterations(adapter, adapterName, testText.text, iterations);
    const statistics = this.calculateTestStatistics(testMetrics, iterations, wordCount);
    const assessment = this.performPerformanceAssessment(wordCount, statistics);
    const issues = extractIssues(assessment);

    return this.buildTestResult({
      adapterName,
      testText,
      iterations,
      wordCount,
      statistics,
      assessment,
      issues,
    });
  }

  /**
   * Extract word count from text
   * @param {string} text - Text to analyze
   * @returns {number} Number of words in the text
   */
  private extractWordCount(text: string): number {
    return text.split(' ').length;
  }

  /**
   * Calculate test statistics from metrics
   * @param {object} testMetrics - Test execution metrics
   * @param {number[]} testMetrics.synthesisTimes - Array of synthesis times
   * @param {number[]} testMetrics.memoryUsages - Array of memory usages
   * @param {number} testMetrics.successCount - Number of successful iterations
   * @param {number} iterations - Total iterations
   * @param {number} wordCount - Word count of test text
   * @returns {TestResult['results']} Calculated statistics
   */
  private calculateTestStatistics(
    testMetrics: { synthesisTimes: number[]; memoryUsages: number[]; successCount: number },
    iterations: number,
    wordCount: number
  ): TestResult['results'] {
    return calculateStatistics({
      synthesisTimes: testMetrics.synthesisTimes,
      memoryUsages: testMetrics.memoryUsages,
      successCount: testMetrics.successCount,
      iterations,
      wordCount,
    });
  }

  /**
   * Perform performance assessment for test results
   * @param {number} wordCount - Word count of test text
   * @param {TestResult['results']} statistics - Test statistics
   * @returns {ReturnType<typeof PerformanceCalculator.meetsPerformanceTargets>} Performance assessment results
   */
  private performPerformanceAssessment(wordCount: number, statistics: TestResult['results']): ReturnType<typeof PerformanceCalculator.meetsPerformanceTargets> {
    return PerformanceCalculator.meetsPerformanceTargets(
      {
        wordCount,
        synthesisTimeMs: statistics.avgSynthesisTime,
        memoryUsageMB: statistics.avgMemoryUsage,
        qualityScore: MOCK_QUALITY_SCORE,
      },
      this.config.targets
    );
  }

  /**
   * Build test result object
   * @param {object} params - Test result parameters
   * @param {string} params.adapterName - Name of the adapter
   * @param {object} params.testText - Test text configuration
   * @param {string} params.testText.name - Name of the test text
   * @param {string} params.testText.text - The test text content
   * @param {string} params.testText.category - Category of the test text (short, medium, long)
   * @param {number} params.iterations - Number of iterations
   * @param {number} params.wordCount - Word count
   * @param {TestResult['results']} params.statistics - Test statistics
   * @param {ReturnType<typeof PerformanceCalculator.meetsPerformanceTargets>} params.assessment - Performance assessment
   * @param {string[]} params.issues - List of issues
   * @returns {TestResult} Complete test result
   */
  private buildTestResult({
    adapterName,
    testText,
    iterations,
    wordCount,
    statistics,
    assessment,
    issues,
  }: {
    adapterName: string;
    testText: { name: string; text: string; category: string };
    iterations: number;
    wordCount: number;
    statistics: TestResult['results'];
    assessment: ReturnType<typeof PerformanceCalculator.meetsPerformanceTargets>;
    issues: string[];
  }): TestResult {
    return {
      adapterName,
      testName: testText.name,
      category: testText.category,
      iterations,
      wordCount,
      results: statistics,
      meetsTargets: assessment.meetsAll,
      assessment,
      issues,
    };
  }

  /**
   * Run test iterations
   * @param {MockTTSAdapter} adapter - The adapter to test
   * @param {string} adapterName - Name of the adapter
   * @param {string} text - Text to synthesize
   * @param {number} iterations - Number of iterations
   * @returns {Promise<{synthesisTimes: number[]; memoryUsages: number[]; successCount: number}>} Promise containing iteration results
   */
  private async runTestIterations(
    adapter: MockTTSAdapter,
    adapterName: string,
    text: string,
    iterations: number
  ): Promise<{ synthesisTimes: number[]; memoryUsages: number[]; successCount: number }> {
    const synthesisTimes: number[] = [];
    const memoryUsages: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        const response = await adapter.synthesize(text);
        const endTime = Date.now();

        synthesisTimes.push(endTime - startTime);
        memoryUsages.push(response.metadata.memoryUsage);
        successCount++;

        // Record in performance monitor
        performanceMonitor.recordSynthesisMetrics(adapterName, {
          text,
        }, response, startTime);

      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`    ❌ Iteration ${i + 1} failed:`, error);
      }
    }

    return { synthesisTimes, memoryUsages, successCount };
  }
}

/**
 * Default test configuration
 */
const defaultConfig: PerformanceTestConfig = {
  testTexts: [
    {
      name: 'Short Text',
      text: 'This is a short performance test text.',
      category: 'short',
    },
    {
      name: 'Medium Text',
      text: 'This is a medium length performance test text that contains multiple sentences and provides a more realistic test of the TTS synthesis performance under normal operating conditions.',
      category: 'medium',
    },
    {
      name: 'Long Text',
      text: 'This is a comprehensive long-form performance test text designed to thoroughly evaluate the TTS adapter system\'s capabilities. It contains multiple complex sentences with varying structures and lengths, which should help identify performance bottlenecks, memory usage patterns, and overall system stability when processing larger content blocks. The text is structured to simulate real-world usage scenarios where users might need to synthesize longer documents, articles, or book chapters.',
      category: 'long',
    },
  ],
  iterations: DEFAULT_ITERATIONS,
  concurrentRequests: DEFAULT_CONCURRENT,
  targets: DEFAULT_PERFORMANCE_TARGETS,
  outputFormat: 'markdown',
  outputFile: 'performance-test-results.md',
};

/**
 * Main execution function
 */
async function main(): Promise<void> {
  logScriptHeader();

  const args = process.argv.slice(ARGUMENT_START_INDEX);
  const config = { ...defaultConfig };

  if (shouldShowHelp(args)) {
    showHelp(DEFAULT_ITERATIONS, DEFAULT_CONCURRENT);
    process.exit(0);
  }

  parseCommandLineArguments(args, config);

  try {
    const results = await runPerformanceTests(config);
    await outputResults(results, config);
    process.exit(results.summary.failedTests > 0 ? 1 : 0);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

/**
 * Log script header
 */
function logScriptHeader(): void {
  // eslint-disable-next-line no-console
  console.log('🎯 TTS Adapter Performance Testing');
  // eslint-disable-next-line no-console
  console.log('=====================================\n');
}


/**
 * Run performance tests
 * @param {PerformanceTestConfig} config - Test configuration
 * @returns {Promise<TestResults>} Promise containing test results
 */
async function runPerformanceTests(config: PerformanceTestConfig): Promise<TestResults> {
  const runner = new PerformanceTestRunner(config);
  return runner.runTests();
}

/**
 * Output test results
 * @param {TestResults} results - Test results
 * @param {PerformanceTestConfig} config - Test configuration
 */
async function outputResults(results: TestResults, config: PerformanceTestConfig): Promise<void> {
  await (config.outputFormat === 'json' ? outputJsonResults(results, config) : outputMarkdownResults(results, config));
}

// Run the script
if (import.meta.main) {
  main().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}