/**
 * Reporting and display utilities for quality gates validation results
 */

import { CONSTANTS } from './quality-gates-config';
import { Logger } from './quality-gates-logger';
import type { ValidationResult, QualityGateResult } from './quality-gates-types';

/**
 * Displays the validation summary with detailed information
 * @param {ValidationResult} result - Validation result to display
 */
export function displayValidationSummary(result: ValidationResult): void {
  const separatorLine = '='.repeat(CONSTANTS.CONSOLE_LINE_LENGTH);
  const headerLine = `\n${separatorLine}`;

  Logger.log(headerLine);
  Logger.log('QUALITY GATES VALIDATION SUMMARY');
  Logger.log(separatorLine);
  Logger.log(`📊 Total gates: ${result.totalGates}`);
  Logger.log(`✅ Passed: ${result.passedGates}`);
  Logger.log(`❌ Failed: ${result.failedGates}`);

  const successRate = calculateSuccessRate(result.passedGates, result.totalGates);
  Logger.log(`🎯 Success rate: ${successRate}%`);

  Logger.logSummaryLine(result.summary);
}

/**
 * Handles validation failure by displaying error messages and required actions
 * @param {ValidationResult} result - Validation result that failed
 */
export function handleValidationFailure(result: ValidationResult): void {
  Logger.log('\n🚨 QUALITY GATES FAILED - STORY COMPLETION BLOCKED');
  Logger.log('================================================');
  Logger.log('Action required:');
  Logger.log('1. Fix ALL failing quality gates');
  Logger.log('2. Remove ALL forbidden patterns');
  Logger.log('3. Re-run validation when issues are resolved');
  Logger.log('4. NO manual overrides permitted');

  displaySpecificFailures(result.results);
}

/**
 * Handles validation success by displaying success message
 */
export function handleValidationSuccess(): void {
  Logger.log('\n🎉 ALL QUALITY GATES PASSED - PROCEED TO COMPLETION');
  Logger.log('==================================================');
}

/**
 * Calculates the success rate as a percentage
 * @param {number} passedGates - Number of gates that passed
 * @param {number} totalGates - Total number of gates
 * @returns {string} Success rate formatted as a percentage with one decimal place
 */
function calculateSuccessRate(passedGates: number, totalGates: number): string {
  return ((passedGates / totalGates) * CONSTANTS.SUCCESS_RATE_MULTIPLIER).toFixed(1);
}

/**
 * Displays specific failure details for debugging purposes
 * @param {QualityGateResult[]} results - All quality gate results
 */
function displaySpecificFailures(results: QualityGateResult[]): void {
  const failures = results.filter(result => !result.passed);

  if (failures.length > 0) {
    Logger.log('\n📋 Specific failures to address:');
    for (const failure of failures) {
      Logger.log(`  • ${failure.name}: ${failure.error}`);
    }
  }
}

/**
 * Generates a comprehensive validation report for logging purposes
 * @param {ValidationResult} result - Validation result to report on
 * @returns {string} Formatted report string
 */
export function generateValidationReport(result: ValidationResult): string {
  const timestamp = new Date().toISOString();
  const reportLines = [
    `Quality Gates Validation Report - ${timestamp}`,
    '='.repeat(CONSTANTS.REPORT_LINE_LENGTH),
    `Status: ${result.success ? 'PASSED' : 'FAILED'}`,
    `Total Gates: ${result.totalGates}`,
    `Passed: ${result.passedGates}`,
    `Failed: ${result.failedGates}`,
    `Success Rate: ${calculateSuccessRate(result.passedGates, result.totalGates)}%`,
    '',
    'Detailed Results:',
    ...result.results.map(gateResult =>
      `  ${gateResult.passed ? '✅' : '❌'} ${gateResult.name}: ${gateResult.passed ? 'PASSED' : 'FAILED'}`
    ),
    '',
    `Summary: ${result.summary}`,
    '='.repeat(CONSTANTS.REPORT_LINE_LENGTH)
  ];

  return reportLines.join('\n');
}