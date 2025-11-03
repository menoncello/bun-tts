/**
 * Structure validation and correction interface.
 * Provides comprehensive validation of document structure with user correction capabilities.
 */

import type { DocumentStructure } from './types';
import type { StructureCorrection } from './types/structure-analyzer-types';
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types/validation-types';

/**
 * Default validation constants
 */
const VALIDATION_THRESHOLDS = {
  // Chapter validation
  MIN_CHAPTER_WORDS: 50,

  // Paragraph validation
  MIN_PARAGRAPH_CONFIDENCE: 0.5,
  CONFIDENCE_DECIMAL_PLACES: 2,

  // Sentence validation
  MIN_SENTENCE_WORDS: 3,
  MAX_SENTENCE_WORDS: 100,

  // Overall confidence
  LOW_CONFIDENCE_THRESHOLD: 0.5,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.7,

  // Chapter consistency
  MIN_CHAPTER_LENGTH_MULTIPLIER: 0.2,
  MAX_CHAPTER_LENGTH_MULTIPLIER: 5,

  // Scoring weights
  CHAPTER_SCORE_ERROR_WEIGHT: 0.3,
  CHAPTER_SCORE_WARNING_WEIGHT: 0.1,
  PARAGRAPH_SCORE_ERROR_WEIGHT: 0.3,
  PARAGRAPH_SCORE_WARNING_WEIGHT: 0.1,
  SENTENCE_SCORE_ERROR_WEIGHT: 0.3,
  SENTENCE_SCORE_WARNING_WEIGHT: 0.05,
  COHERENCE_SCORE_ERROR_WEIGHT: 0.4,
  COHERENCE_SCORE_WARNING_WEIGHT: 0.1,

  // Validation options
  DEFAULT_MIN_CONFIDENCE: 0.5,
  DEFAULT_MAX_WARNINGS: 10,
  DEFAULT_REQUIRE_MANUAL_REVIEW_BELOW: 0.6,

  // Confidence recalculation
  SENTENCE_SAMPLING_RATE: 10,
  DEFAULT_SENTENCE_CONFIDENCE: 0.75,
  DEFAULT_CONFIDENCE: 0.5,

  // Recommendations
  SINGLE_CHAPTER_WORD_THRESHOLD: 5000,
  MAX_RECOMMENDED_CHAPTERS: 50,

  // Validation threshold
  VALIDATION_PASS_THRESHOLD: 0.5,
};

/**
 * Structure validation result with detailed information
 */
export interface StructureValidationResult {
  /** Whether structure is valid */
  isValid: boolean;
  /** Overall validation score (0-1) */
  overallScore: number;
  /** Whether confidence meets threshold */
  meetsConfidenceThreshold: boolean;
  /** Whether too many warnings */
  hasTooManyWarnings: boolean;
  /** Whether manual review is required */
  needsManualReview: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Applied corrections */
  corrections: StructureCorrection[];
  /** Whether auto-correction is possible */
  canAutoCorrect: boolean;
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Validation rule for custom structure validation
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Validation function */
  validate: (structure: DocumentStructure) => ValidationResult;
}

export { VALIDATION_THRESHOLDS };
