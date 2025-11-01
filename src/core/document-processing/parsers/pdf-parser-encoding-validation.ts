/**
 * Encoding validation utilities for PDF parser.
 * Validates encoding detection results and provides recommendations.
 */

// Magic number constants for encoding validation thresholds
const LOW_CONFIDENCE_THRESHOLD = 0.8;
const MINIMUM_CONFIDENCE_SCORE = 0.5;
const CONFIDENCE_PENALTY_PER_ISSUE = 0.2;

import {
  UTF8_BOM,
  UTF16LE_BOM,
  UTF16BE_BOM,
  UTF32LE_BOM,
  UTF32BE_BOM,
  ENCODING_UTF8,
  ENCODING_WINDOWS1252,
  ENCODING_ISO8859_15,
  CJK_ENCODINGS,
  UTF_ENCODINGS,
} from './pdf-parser-encoding-constants';
import { detectCharacterScript } from './pdf-parser-text-analysis';

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Simple validation result interface
 */
interface SimpleValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Checks if encoding supports CJK characters
 * @param {string} encoding - Encoding to check
 * @returns {boolean} True if encoding supports CJK
 */
function supportsCjk(encoding: string): boolean {
  return (
    encoding === ENCODING_UTF8 ||
    CJK_ENCODINGS.includes(encoding as (typeof CJK_ENCODINGS)[number])
  );
}

/**
 * Checks if encoding supports RTL characters
 * @param {string} encoding - Encoding to check
 * @returns {boolean} True if encoding supports RTL
 */
function supportsRtl(encoding: string): boolean {
  return encoding.startsWith('utf-');
}

/**
 * Checks if encoding is UTF-based
 * @param {string} encoding - Encoding to check
 * @returns {boolean} True if encoding is UTF-based
 */
function isUtfEncoding(encoding: string): boolean {
  return UTF_ENCODINGS.includes(encoding as (typeof UTF_ENCODINGS)[number]);
}

/**
 * Validates CJK text encoding
 * @param {{ hasCjk: boolean }} scriptAnalysis - Character script analysis object containing hasCjk flag
 * @param {boolean} scriptAnalysis.hasCjk - Flag indicating if CJK characters are present
 * @param {string} encoding - Detected encoding
 * @param {string[]} issues - Issues array to add validation issues to
 * @param {string[]} recommendations - Recommendations array to add recommendations to
 * @returns {void}
 */
function validateCjkText(
  scriptAnalysis: { hasCjk: boolean },
  encoding: string,
  issues: string[],
  recommendations: string[]
): void {
  if (scriptAnalysis.hasCjk && !supportsCjk(encoding)) {
    issues.push(
      'CJK characters detected but encoding may not support them properly'
    );
    recommendations.push(
      'Consider using UTF-8, GB2312, Shift_JIS, EUC-KR, or Big5 for CJK text'
    );
  }
}

/**
 * Validates RTL text encoding
 * @param {{ hasRtl: boolean }} scriptAnalysis - Character script analysis object containing hasRtl flag
 * @param {boolean} scriptAnalysis.hasRtl - Flag indicating if RTL characters are present
 * @param {string} encoding - Detected encoding
 * @param {string[]} issues - Issues array to add validation issues to
 * @param {string[]} recommendations - Recommendations array to add recommendations to
 * @returns {void}
 */
function validateRtlText(
  scriptAnalysis: { hasRtl: boolean },
  encoding: string,
  issues: string[],
  recommendations: string[]
): void {
  if (scriptAnalysis.hasRtl && !supportsRtl(encoding)) {
    issues.push(
      'RTL text detected but legacy encoding may not handle it correctly'
    );
    recommendations.push('Use UTF-8 or UTF-16 for proper RTL text rendering');
  }
}

/**
 * Validates Euro symbol usage
 * @param {string} text - Text to validate
 * @param {string} encoding - Detected encoding
 * @param {string[]} warnings - Warnings array to add validation warnings to
 * @returns {void}
 */
function validateEuroSymbol(
  text: string,
  encoding: string,
  warnings: string[]
): void {
  if (
    /€/.test(text) &&
    encoding !== ENCODING_WINDOWS1252 &&
    encoding !== ENCODING_ISO8859_15
  ) {
    warnings.push(
      'Euro symbol (€) detected - consider Windows-1252 or ISO-8859-15 encoding'
    );
  }
}

/**
 * Validates BOM consistency
 * @param {string} text - Text to validate
 * @param {string} encoding - Detected encoding
 * @param {string[]} warnings - Warnings array to add validation warnings to
 * @returns {void}
 */
function validateBomConsistency(
  text: string,
  encoding: string,
  warnings: string[]
): void {
  const firstChar = text.charCodeAt(0);
  const hasBOM = [
    UTF8_BOM,
    UTF16LE_BOM,
    UTF16BE_BOM,
    UTF32LE_BOM,
    UTF32BE_BOM,
  ].includes(firstChar);

  if (hasBOM && !isUtfEncoding(encoding)) {
    warnings.push(
      'BOM detected but encoding does not match expected UTF format'
    );
  }

  if (!hasBOM && encoding.includes('-bom')) {
    warnings.push('BOM encoding detected but no BOM present in text');
  }
}

/**
 * Validates encoding detection with enhanced script awareness
 * @param {string} text - Text to validate
 * @param {string} encoding - Detected encoding
 * @param {number} confidence - Confidence score
 * @returns {ValidationResult} Validation result
 */
export function validateAdvancedEncodingDetection(
  text: string,
  encoding: string,
  confidence: number
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Basic confidence check
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    issues.push('Low confidence encoding detection');
  }

  // Script-specific validation
  const scriptAnalysis = detectCharacterScript(text);

  // Validate CJK text
  validateCjkText(scriptAnalysis, encoding, issues, recommendations);

  // Validate RTL text
  validateRtlText(scriptAnalysis, encoding, issues, recommendations);

  // Check for Windows-1252 specific characters
  validateEuroSymbol(text, encoding, warnings);

  // BOM validation
  validateBomConsistency(text, encoding, warnings);

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Validates encoding detection results
 * @param {string} text - Text to validate
 * @param {string} encoding - Detected encoding
 * @param {number} confidence - Confidence score for encoding detection
 * @returns {SimpleValidationResult} Validation result with potential issues
 */
export function validateEncodingDetection(
  text: string,
  encoding: string,
  confidence: number
): SimpleValidationResult {
  const issues: string[] = [];

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    issues.push('Low confidence encoding detection');
  }

  if (text.length > 0 && encoding === 'ascii') {
    // Check if there are actually non-ASCII characters
    const hasNonAscii = /[\u0080-\uFFFF]/.test(text);
    if (hasNonAscii) {
      issues.push('ASCII encoding detected but non-ASCII characters present');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Checks for length changes between original and converted text
 * @param {string} originalText - Original text
 * @param {string} convertedText - Converted text
 * @returns {string[]} Length change issues
 */
function checkLengthChanges(
  originalText: string,
  convertedText: string
): string[] {
  const issues: string[] = [];

  if (convertedText.length !== originalText.length) {
    issues.push(
      `Length changed: ${originalText.length} → ${convertedText.length}`
    );
  }

  return issues;
}

/**
 * Checks for replacement characters indicating data loss
 * @param {string} convertedText - Converted text to check
 * @returns {string[]} Replacement character issues
 */
function checkReplacementCharacters(convertedText: string): string[] {
  const issues: string[] = [];

  if (convertedText.includes('�')) {
    issues.push('Contains replacement characters (�) - possible data loss');
  }

  return issues;
}

/**
 * Calculates confidence based on issues found
 * @param {string[]} issues - List of issues found
 * @returns {number} Confidence score (0-1)
 */
function calculateConfidence(issues: string[]): number {
  if (issues.length === 0) {
    return 1.0;
  }
  return Math.max(
    MINIMUM_CONFIDENCE_SCORE,
    1.0 - issues.length * CONFIDENCE_PENALTY_PER_ISSUE
  );
}

/**
 * Validates encoding conversion results
 * @param {string} originalText - Original text before conversion
 * @param {string} convertedText - Text after conversion
 * @param {string} _fromEncoding - Source encoding (intentionally unused)
 * @param {string} _toEncoding - Target encoding (intentionally unused)
 * @returns {object} Validation results with isValid, confidence, and issues
 */
export function validateEncodingConversion(
  originalText: string,
  convertedText: string,
  _fromEncoding: string,
  _toEncoding: string
): {
  isValid: boolean;
  confidence: number;
  issues: string[];
} {
  // Basic validation checks
  if (originalText.length === 0 && convertedText.length === 0) {
    return { isValid: true, confidence: 1.0, issues: [] };
  }

  const issues = [
    ...checkLengthChanges(originalText, convertedText),
    ...checkReplacementCharacters(convertedText),
  ];

  const confidence = calculateConfidence(issues);

  return {
    isValid: issues.length === 0,
    confidence,
    issues,
  };
}
