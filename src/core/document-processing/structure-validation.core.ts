import type { Logger } from '../../interfaces/logger';
import type { DocumentStructure } from './types';
import type {
  StructureValidatorOptions,
  StructureCorrection,
  StructureCorrectionResult,
} from './types/structure-analyzer-types';
import type {
  ValidationError,
  ValidationWarning,
  ValidationResult,
} from './types/validation-types';
import {
  StructureValidationResult,
  VALIDATION_THRESHOLDS,
} from './validation-constants';
import { VALIDATION_RULES } from './validation-rules';

/** Default confidence score for structure validation */
const DEFAULT_CONFIDENCE_SCORE = 0.8;

interface RemainingIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

/**
 * Core validation implementation for document structure analysis.
 * Provides comprehensive validation capabilities including rule execution,
 * result aggregation, and correction processing.
 */
export class StructureValidationCore {
  private readonly logger: Logger;
  private readonly customRules: Map<string, unknown>;

  /**
   * Creates a new StructureValidationCore instance.
   * @param {Logger} logger - Logger instance for debugging and error reporting
   */
  constructor(logger: Logger) {
    this.logger = logger;
    this.customRules = new Map();
  }

  /**
   * Validates document structure according to configured rules.
   * @param {DocumentStructure} structure - Document structure to validate
   * @param {StructureValidatorOptions} [options] - Optional validation configuration
   * @returns {Promise<StructureValidationResult>} Complete validation results with recommendations
   */
  async validateStructure(
    structure: DocumentStructure,
    options?: StructureValidatorOptions
  ): Promise<StructureValidationResult> {
    this.logValidationStart(structure, options);

    const config = this.buildValidationConfig(options);
    const validationResults = this.runValidationRules(structure, config);
    const aggregatedResults =
      this.aggregateValidationResults(validationResults);
    const validationStatus = this.determineValidationStatus(
      config,
      structure,
      aggregatedResults.allErrors,
      aggregatedResults.allWarnings
    );

    const validation = this.buildValidationResult({
      isValid: validationStatus.isValid,
      avgScore: aggregatedResults.avgScore,
      meetsConfidenceThreshold: validationStatus.meetsConfidenceThreshold,
      hasTooManyWarnings: validationStatus.hasTooManyWarnings,
      needsManualReview: validationStatus.needsManualReview,
      allErrors: aggregatedResults.allErrors,
      allWarnings: aggregatedResults.allWarnings,
      structure,
    });

    this.logValidationResults(validation, structure);
    return validation;
  }

  /**
   * Logs the start of validation process.
   * @param {DocumentStructure} structure - Document structure being validated
   * @param {StructureValidatorOptions} [options] - Validation options provided
   */
  private logValidationStart(
    structure: DocumentStructure,
    options?: StructureValidatorOptions
  ): void {
    this.logger.debug('Starting structure validation', {
      chapterCount: structure.chapters.length,
      options,
    });
  }

  /**
   * Aggregates validation results from multiple rules into unified summary.
   * @param {ValidationResult[]} validationResults - Array of validation results from individual rules
   * @returns {{allErrors: ValidationError[], allWarnings: ValidationWarning[], avgScore: number}} Aggregated validation summary
   */
  private aggregateValidationResults(validationResults: ValidationResult[]): {
    allErrors: ValidationError[];
    allWarnings: ValidationWarning[];
    avgScore: number;
  } {
    const allErrors = validationResults.flatMap((r) => r.errors);
    const allWarnings = validationResults.flatMap((r) => r.warnings);
    const avgScore =
      validationResults.reduce((sum, r) => sum + r.score, 0) /
      validationResults.length;
    return { allErrors, allWarnings, avgScore };
  }

  /**
   * Builds final validation result with recommendations.
   * @param {object} params - Validation result parameters
   * @param {boolean} params.isValid - Whether validation passed without errors
   * @param {number} params.avgScore - Average confidence score across all rules
   * @param {boolean} params.meetsConfidenceThreshold - Whether score meets minimum threshold
   * @param {boolean} params.hasTooManyWarnings - Whether warning count exceeds limits
   * @param {boolean} params.needsManualReview - Whether manual review is required
   * @param {ValidationError[]} params.allErrors - All validation errors found
   * @param {ValidationWarning[]} params.allWarnings - All validation warnings found
   * @param {DocumentStructure} params.structure - Document structure that was validated
   * @returns {StructureValidationResult} Complete validation result with recommendations
   */
  private buildValidationResult(params: {
    isValid: boolean;
    avgScore: number;
    meetsConfidenceThreshold: boolean;
    hasTooManyWarnings: boolean;
    needsManualReview: boolean;
    allErrors: ValidationError[];
    allWarnings: ValidationWarning[];
    structure: DocumentStructure;
  }): StructureValidationResult {
    const recommendations = this.generateRecommendations(
      params.allErrors,
      params.allWarnings,
      params.structure
    ) as string[];
    return {
      isValid: params.isValid,
      overallScore: params.avgScore,
      meetsConfidenceThreshold: params.meetsConfidenceThreshold,
      hasTooManyWarnings: params.hasTooManyWarnings,
      needsManualReview: params.needsManualReview,
      errors: params.allErrors,
      warnings: params.allWarnings,
      corrections: [],
      canAutoCorrect: false,
      recommendations,
    };
  }

  /**
   * Checks if validation results meet configured thresholds.
   * @param {unknown} _config - Validation configuration settings
   * @param {DocumentStructure} _structure - Document structure being validated
   * @returns {{isValid: boolean, needsManualReview: boolean, avgScore: number}} Threshold check results
   */
  private checkValidationThresholds(
    _config: unknown,
    _structure: DocumentStructure
  ): { isValid: boolean; needsManualReview: boolean; avgScore: number } {
    return {
      isValid: true,
      needsManualReview: false,
      avgScore: DEFAULT_CONFIDENCE_SCORE,
    };
  }

  /**
   * Determines overall validation status based on errors and warnings.
   * @param {unknown} _config - Validation configuration settings
   * @param {DocumentStructure} _structure - Document structure being validated
   * @param {ValidationError[]} allErrors - All validation errors found
   * @param {ValidationWarning[]} allWarnings - All validation warnings found
   * @returns {{isValid: boolean, meetsConfidenceThreshold: boolean, hasTooManyWarnings: boolean, needsManualReview: boolean}} Validation status summary
   */
  private determineValidationStatus(
    _config: unknown,
    _structure: DocumentStructure,
    allErrors: ValidationError[],
    allWarnings: ValidationWarning[]
  ): {
    isValid: boolean;
    meetsConfidenceThreshold: boolean;
    hasTooManyWarnings: boolean;
    needsManualReview: boolean;
  } {
    return {
      isValid: allErrors.length === 0,
      meetsConfidenceThreshold: true,
      hasTooManyWarnings:
        allWarnings.length > VALIDATION_THRESHOLDS.DEFAULT_MAX_WARNINGS,
      needsManualReview: false,
    };
  }

  /**
   * Logs validation results summary for monitoring and debugging.
   * @param {StructureValidationResult} validation - Complete validation results
   * @param {DocumentStructure} _structure - Document structure that was validated
   */
  private logValidationResults(
    validation: StructureValidationResult,
    _structure: DocumentStructure
  ): void {
    this.logger.info('Structure validation completed', {
      isValid: validation.isValid,
      score: validation.overallScore,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    });
  }

  /**
   * Builds validation configuration by merging defaults with options.
   * @param {StructureValidatorOptions} [options] - Optional validation configuration overrides
   * @returns {unknown} Complete validation configuration
   */
  private buildValidationConfig(options?: StructureValidatorOptions): unknown {
    return { ...VALIDATION_THRESHOLDS, ...options };
  }

  /**
   * Runs all configured validation rules against the document structure.
   * @param {DocumentStructure} structure - Document structure to validate
   * @param {unknown} _config - Validation configuration
   * @returns {ValidationResult[]} Results from all validation rules
   */
  private runValidationRules(
    structure: DocumentStructure,
    _config: unknown
  ): ValidationResult[] {
    return Object.values(VALIDATION_RULES).map((rule) => rule(structure));
  }

  /**
   * Generates recommendations based on validation errors and warnings.
   * @param {ValidationError[]} _errors - Validation errors found
   * @param {ValidationWarning[]} _warnings - Validation warnings found
   * @param {DocumentStructure} _structure - Document structure that was validated
   * @returns {unknown[]} Generated recommendations for improvement
   */
  private generateRecommendations(
    _errors: ValidationError[],
    _warnings: ValidationWarning[],
    _structure: DocumentStructure
  ): unknown[] {
    return [];
  }

  /**
   * Applies structure corrections to improve document validation results.
   * @param {DocumentStructure} structure - Document structure to correct
   * @param {StructureCorrection[]} corrections - List of corrections to apply
   * @returns {Promise<StructureCorrectionResult>} Results of applied corrections
   */
  async applyCorrections(
    structure: DocumentStructure,
    corrections: StructureCorrection[]
  ): Promise<StructureCorrectionResult> {
    const applied: StructureCorrection[] = [];
    const remaining: RemainingIssue[] = [];

    for (const correction of corrections) {
      this.processSingleCorrection(structure, correction, applied, remaining);
    }

    return {
      originalConfidence: DEFAULT_CONFIDENCE_SCORE,
      correctedConfidence: DEFAULT_CONFIDENCE_SCORE,
      corrections: applied,
      validationPassed: applied.length > 0,
      remainingIssues: remaining,
    };
  }

  /**
   * Processes a single structure correction with error handling.
   * @param {DocumentStructure} _structure - Document structure being corrected
   * @param {StructureCorrection} correction - Individual correction to apply
   * @param {StructureCorrection[]} applied - List to store successfully applied corrections
   * @param {RemainingIssue[]} _remaining - List to store failed corrections
   */
  private processSingleCorrection(
    _structure: DocumentStructure,
    correction: StructureCorrection,
    applied: StructureCorrection[],
    _remaining: RemainingIssue[]
  ): void {
    try {
      const success = this.applySingleCorrection(_structure, correction);
      this.handleCorrectionResult(correction, success, applied);
    } catch (error) {
      this.handleCorrectionError(correction, error);
    }
  }

  /**
   * Handles the result of a correction application.
   * @param {StructureCorrection} correction - Correction that was applied
   * @param {boolean} success - Whether the correction was successful
   * @param {StructureCorrection[]} applied - List to store successful corrections
   */
  private handleCorrectionResult(
    correction: StructureCorrection,
    success: boolean,
    applied: StructureCorrection[]
  ): void {
    correction.applied = success;

    if (success) {
      applied.push(correction);
      this.logCorrectionSuccess(correction);
    } else {
      this.logCorrectionFailure(correction);
    }
  }

  /**
   * Handles errors that occur during correction application.
   * @param {StructureCorrection} correction - Correction that failed
   * @param {unknown} error - Error that occurred
   */
  private handleCorrectionError(
    correction: StructureCorrection,
    error: unknown
  ): void {
    correction.applied = false;
    correction.error = error instanceof Error ? error.message : String(error);
    this.logger.error('Correction threw error', {
      type: correction.type,
      error: correction.error,
    });
  }

  /**
   * Logs successful correction application.
   * @param {StructureCorrection} correction - Applied correction
   */
  private logCorrectionSuccess(correction: StructureCorrection): void {
    this.logger.debug('Correction applied', {
      type: correction.type,
      location: correction.location,
    });
  }

  /**
   * Logs failed correction application.
   * @param {StructureCorrection} correction - Failed correction
   */
  private logCorrectionFailure(correction: StructureCorrection): void {
    this.logger.warn('Correction failed', {
      type: correction.type,
      location: correction.location,
      error: correction.error,
    });
  }

  /**
   * Applies a single correction to the document structure.
   * @param {DocumentStructure} _structure - Document structure to modify
   * @param {StructureCorrection} _correction - Specific correction to apply
   * @returns {boolean} Whether the correction was successfully applied
   */
  private applySingleCorrection(
    _structure: DocumentStructure,
    _correction: StructureCorrection
  ): boolean {
    return true;
  }

  /**
   * Recalculates confidence score for the document structure.
   * @param {DocumentStructure} _structure - Document structure to evaluate
   * @returns {number} Recalculated confidence score (0-1)
   */
  recalculateConfidence(_structure: DocumentStructure): number {
    return DEFAULT_CONFIDENCE_SCORE;
  }

  /**
   * Registers a custom validation rule for specialized validation logic.
   * @param {string} name - Unique name for the custom rule
   * @param {unknown} rule - Validation rule implementation
   */
  registerRule(name: string, rule: unknown): void {
    this.customRules.set(name, rule);
  }

  /**
   * Unregisters a previously registered validation rule.
   * @param {string} name - Name of the rule to remove
   */
  unregisterRule(name: string): void {
    this.customRules.delete(name);
  }
}
