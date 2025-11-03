/**
 * Validation types for document processing quality assurance.
 * Provides interfaces for validation results and error reporting.
 */

/**
 * Parser validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors found */
  errors: ValidationError[];
  /** Validation warnings found */
  warnings: ValidationWarning[];
  /** Overall validation score (0-1) */
  score: number;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code for categorization */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Location where error occurred */
  location: {
    chapter?: number;
    paragraph?: number;
    sentence?: number;
    line?: number;
  };
  /** Error severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code for categorization */
  code: string;
  /** Human-readable warning message */
  message: string;
  /** Location where warning occurred */
  location: {
    chapter?: number;
    paragraph?: number;
    sentence?: number;
    line?: number;
  };
  /** Warning severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested action for the warning */
  suggestion?: string;
}
