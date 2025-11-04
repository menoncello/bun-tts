/**
 * Performance Test CLI Utilities
 * Command line argument parsing and help functionality
 */

import type { PerformanceTestConfig } from './performance-test-types.js';

/** Help flag constants */
const HELP_FLAG_SHORT = '-h';
const HELP_FLAG_LONG = '--help';
const ITERATIONS_FLAG = '--iterations';
const CONCURRENT_FLAG = '--concurrent';
const OUTPUT_FLAG = '--output';
const FILE_FLAG = '--file';

/**
 * Check if help should be shown
 * @param {string[]} args - Command line arguments
 * @returns {boolean} True if help should be shown
 */
export function shouldShowHelp(args: string[]): boolean {
  return args.includes(HELP_FLAG_SHORT) || args.includes(HELP_FLAG_LONG);
}

/**
 * Show help information
 * @param {number} defaultIterations - Default number of iterations
 * @param {number} defaultConcurrent - Default number of concurrent requests
 */
export function showHelp(defaultIterations: number, defaultConcurrent: number): void {
  // eslint-disable-next-line no-console
  console.log(`
Usage: bun run scripts/performance-test.ts [options]

Options:
  --iterations <n>     Number of test iterations (default: ${defaultIterations})
  --concurrent <n>     Number of concurrent requests (default: ${defaultConcurrent})
  --output <format>    Output format: json | markdown (default: markdown)
  --file <path>        Output file path (default: performance-test-results.md)
  --help, -h           Show this help message

Examples:
  bun run scripts/performance-test.ts
  bun run scripts/performance-test.ts --iterations 10 --concurrent 3
  bun run scripts/performance-test.ts --output json --file results.json
`);
}

/**
 * Parse iterations argument
 * @param {string[]} args - Command line arguments
 * @param {PerformanceTestConfig} config - Configuration to update
 * @param {number} index - Current index in args array
 * @returns {number} Next index to process
 */
function parseIterations(args: string[], config: PerformanceTestConfig, index: number): number {
  const nextIndex = index + 1;
  if (args[nextIndex]) {
    config.iterations = Number.parseInt(args[nextIndex]);
    return nextIndex + 1;
  }
  return nextIndex;
}

/**
 * Parse concurrent requests argument
 * @param {string[]} args - Command line arguments
 * @param {PerformanceTestConfig} config - Configuration to update
 * @param {number} index - Current index in args array
 * @returns {number} Next index to process
 */
function parseConcurrent(args: string[], config: PerformanceTestConfig, index: number): number {
  const nextIndex = index + 1;
  if (args[nextIndex]) {
    config.concurrentRequests = Number.parseInt(args[nextIndex]);
    return nextIndex + 1;
  }
  return nextIndex;
}

/**
 * Parse output format argument
 * @param {string[]} args - Command line arguments
 * @param {PerformanceTestConfig} config - Configuration to update
 * @param {number} index - Current index in args array
 * @returns {number} Next index to process
 */
function parseOutputFormat(args: string[], config: PerformanceTestConfig, index: number): number {
  const nextIndex = index + 1;
  if (args[nextIndex]) {
    config.outputFormat = args[nextIndex] as 'json' | 'markdown';
    return nextIndex + 1;
  }
  return nextIndex;
}

/**
 * Parse output file argument
 * @param {string[]} args - Command line arguments
 * @param {PerformanceTestConfig} config - Configuration to update
 * @param {number} index - Current index in args array
 * @returns {number} Next index to process
 */
function parseOutputFile(args: string[], config: PerformanceTestConfig, index: number): number {
  const nextIndex = index + 1;
  if (args[nextIndex]) {
    config.outputFile = args[nextIndex];
    return nextIndex + 1;
  }
  return nextIndex;
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @param {PerformanceTestConfig} config - Configuration to update
 */
export function parseCommandLineArguments(args: string[], config: PerformanceTestConfig): void {
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case ITERATIONS_FLAG:
        i = parseIterations(args, config, i);
        break;
      case CONCURRENT_FLAG:
        i = parseConcurrent(args, config, i);
        break;
      case OUTPUT_FLAG:
        i = parseOutputFormat(args, config, i);
        break;
      case FILE_FLAG:
        i = parseOutputFile(args, config, i);
        break;
      default:
        i++;
        break;
    }
  }
}