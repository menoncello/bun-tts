/**
 * Core quality gates execution logic and validation orchestration
 */

import { QUALITY_GATES, CONSTANTS } from './quality-gates-config';
import { Logger } from './quality-gates-logger';
import { processForbiddenPatternResults } from './quality-gates-pattern-validator';
import type { ValidationResult, QualityGateResult, QualityGateExecutionResults } from './quality-gates-types';
import { executeQualityGate, generateSummary } from './quality-gates-utils';

/**
 * Executes all quality gates and returns the validation result
 * @returns {Promise<ValidationResult>} - Complete validation results
 */
export async function validateQualityGates(): Promise<ValidationResult> {
  Logger.logValidationHeader();

  const { results, passedCount, failedCount } = await executeAllQualityGates();
  const { passedCount: forbiddenPassedCount, failedCount: forbiddenFailedCount } =
    await processForbiddenPatternResults(results);

  const totalPassed = passedCount + forbiddenPassedCount;
  const totalFailed = failedCount + forbiddenFailedCount;
  const blockingFailures = results.filter(result => !result.passed && result.blocking).length;
  const success = blockingFailures === 0;

  const summary = generateSummary(success, results.length, totalFailed);

  return {
    success,
    totalGates: results.length,
    passedGates: totalPassed,
    failedGates: totalFailed,
    results,
    summary
  };
}

/**
 * Executes all quality gates and returns initial results
 * @returns {Promise<QualityGateExecutionResults>} - Results and counts from quality gate execution
 */
export async function executeAllQualityGates(): Promise<QualityGateExecutionResults> {
  const results: QualityGateResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  // Execute mandatory quality gates
  for (const gate of QUALITY_GATES) {
    const result = await executeQualityGate(gate);
    results.push(result);

    if (result.passed) {
      Logger.logGateResult(gate.name, true);
      passedCount++;
    } else {
      Logger.logGateResult(gate.name, false, gate.errorMessage, result.error);
      failedCount++;
    }
  }

  return { results, passedCount, failedCount };
}

/**
 * Handles successful validation by displaying success message and exiting
 */
function handleSuccessfulValidation(): void {
  Logger.log('\n🎉 ALL QUALITY GATES PASSED - PROCEED TO COMPLETION');
  Logger.log('==================================================');
  process.exit(CONSTANTS.EXIT_CODE_SUCCESS); // Allow completion
}

/**
 * Handles failed validation by displaying error messages and exiting
 * @param {ValidationResult} result - Validation result that failed
 */
function handleFailedValidation(result: ValidationResult): void {
  Logger.log('\n🚨 QUALITY GATES FAILED - STORY COMPLETION BLOCKED');
  Logger.log('================================================');
  Logger.log('Action required:');
  Logger.log('1. Fix ALL failing quality gates');
  Logger.log('2. Remove ALL forbidden patterns');
  Logger.log('3. Re-run validation when issues are resolved');
  Logger.log('4. NO manual overrides permitted');

  displayValidationFailures(result.results);
  process.exit(CONSTANTS.EXIT_CODE_FAILURE); // Block completion
}

/**
 * Displays specific validation failures for debugging
 * @param {QualityGateResult[]} results - All quality gate results
 */
function displayValidationFailures(results: QualityGateResult[]): void {
  const failures = results.filter(result => !result.passed);

  if (failures.length > 0) {
    Logger.log('\n📋 Specific failures to address:');
    for (const failure of failures) {
      Logger.log(`  • ${failure.name}: ${failure.error}`);
    }
  }
}

/**
 * Main function that runs the quality gates validation and exits with appropriate code
 * @returns {Promise<void>} - Promise that resolves when validation is complete
 */
export async function runQualityGatesValidation(): Promise<void> {
  const result = await validateQualityGates();

  if (result.success) {
    handleSuccessfulValidation();
  } else {
    handleFailedValidation(result);
  }
}

/**
 * Error handler for quality gates validator crashes
 * @param {Error} error - The error that occurred
 * @returns {never} - Never returns, always exits process
 */
export function handleValidatorError(error: Error): never {
  Logger.error('💥 Quality gates validator crashed:');
  Logger.error(error.message);
  process.exit(CONSTANTS.EXIT_CODE_FAILURE);
}