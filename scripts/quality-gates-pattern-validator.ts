/**
 * Forbidden pattern validation functionality for quality gates
 */

import { FORBIDDEN_PATTERNS, CONSTANTS } from './quality-gates-config';
import { Logger } from './quality-gates-logger';
import type { QualityGateResult, ForbiddenPatternResultOptions } from './quality-gates-types';
import { getSourceFiles, scanFilesForPattern } from './quality-gates-utils';

/**
 * Scans source files for all forbidden patterns
 * @returns {Promise<QualityGateResult[]>} - Results of forbidden pattern checks
 */
export async function checkForbiddenPatterns(): Promise<QualityGateResult[]> {
  Logger.log('\n🔍 Checking forbidden patterns in source code...');

  const results: QualityGateResult[] = [];

  for (const forbidden of FORBIDDEN_PATTERNS) {
    const patternResult = await checkSingleForbiddenPattern(forbidden);
    results.push(patternResult);
  }

  return results;
}

/**
 * Checks a single forbidden pattern in source files
 * @param {typeof FORBIDDEN_PATTERNS[0]} forbidden - The forbidden pattern configuration
 * @returns {Promise<QualityGateResult>} - Result of the pattern check
 */
export async function checkSingleForbiddenPattern(
  forbidden: typeof FORBIDDEN_PATTERNS[0]
): Promise<QualityGateResult> {
  Logger.logForbiddenPatternCheck(forbidden.description);

  try {
    const files = getSourceFiles();
    const patternCheckResult = scanFilesForPattern(files, forbidden.pattern);

    if (patternCheckResult.found) {
      return handleFailedPatternCheck(forbidden, patternCheckResult.files);
    }

    return handleSuccessfulPatternCheck(forbidden);
  } catch (error: Error) {
    return handlePatternCheckError(forbidden, error);
  }
}

/**
 * Creates a forbidden pattern result object
 * @param {ForbiddenPatternResultOptions} options - The result options
 * @returns {QualityGateResult} - The result object
 */
export function createForbiddenPatternResult(options: ForbiddenPatternResultOptions): QualityGateResult {
  return {
    name: options.patternName,
    passed: options.passed,
    exitCode: options.exitCode,
    output: options.output,
    error: options.error,
    blocking: options.blocking
  };
}

/**
 * Handles successful forbidden pattern check
 * @param {typeof FORBIDDEN_PATTERNS[0]} forbidden - The forbidden pattern configuration
 * @returns {QualityGateResult} - The success result
 */
export function handleSuccessfulPatternCheck(forbidden: typeof FORBIDDEN_PATTERNS[0]): QualityGateResult {
  return createForbiddenPatternResult({
    patternName: `forbidden_pattern_${forbidden.pattern.source}`,
    passed: true,
    exitCode: CONSTANTS.EXIT_CODE_SUCCESS,
    output: 'No forbidden patterns found',
    error: '',
    blocking: forbidden.blocking
  });
}

/**
 * Handles failed forbidden pattern check
 * @param {typeof FORBIDDEN_PATTERNS[0]} forbidden - The forbidden pattern configuration
 * @param {string[]} files - List of files containing the pattern
 * @returns {QualityGateResult} - The failure result
 */
export function handleFailedPatternCheck(
  forbidden: typeof FORBIDDEN_PATTERNS[0],
  files: string[]
): QualityGateResult {
  return createForbiddenPatternResult({
    patternName: `forbidden_pattern_${forbidden.pattern.source}`,
    passed: false,
    exitCode: CONSTANTS.EXIT_CODE_FAILURE,
    output: '',
    error: `Forbidden pattern found in files: ${files.join(', ')}`,
    blocking: forbidden.blocking
  });
}

/**
 * Handles error in forbidden pattern check
 * @param {typeof FORBIDDEN_PATTERNS[0]} forbidden - The forbidden pattern configuration
 * @param {Error} error - The error that occurred
 * @returns {QualityGateResult} - The error result
 */
export function handlePatternCheckError(
  forbidden: typeof FORBIDDEN_PATTERNS[0],
  error: Error
): QualityGateResult {
  return createForbiddenPatternResult({
    patternName: `forbidden_pattern_${forbidden.pattern.source}`,
    passed: false,
    exitCode: CONSTANTS.EXIT_CODE_FAILURE,
    output: '',
    error: `Error checking forbidden patterns: ${error.message}`,
    blocking: forbidden.blocking
  });
}

/**
 * Processes forbidden pattern results and updates counts
 * @param {QualityGateResult[]} results - Array to store results
 * @returns {Promise<{passedCount: number; failedCount: number}>} - Updated counts from forbidden pattern checks
 */
export async function processForbiddenPatternResults(
  results: QualityGateResult[]
): Promise<{ passedCount: number; failedCount: number }> {
  const forbiddenResults = await checkForbiddenPatterns();
  results.push(...forbiddenResults);

  let passedCount = 0;
  let failedCount = 0;

  for (const result of forbiddenResults) {
    if (result.passed) {
      Logger.log('✅ Forbidden patterns check: PASSED');
      passedCount++;
    } else {
      Logger.log('❌ Forbidden patterns check: FAILED');
      Logger.log(`🚨 ${result.error}`);
      failedCount++;
    }
  }

  return { passedCount, failedCount };
}