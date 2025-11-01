/**
 * Encoding diagnostics utilities for PDF parser.
 * Provides comprehensive encoding analysis and reporting.
 */

const LOW_CONFIDENCE_THRESHOLD = 0.7;

import {
  SUPPORTED_ENCODINGS,
  ASCII_CHARACTER_RANGE_MAX,
  LEGACY_ENCODINGS,
  CJK_ENCODINGS,
} from './pdf-parser-encoding-constants';
import {
  detectEncoding,
  calculateEncodingConfidence,
  hasBOM,
} from './pdf-parser-encoding-detection';
import { validateAdvancedEncodingDetection } from './pdf-parser-encoding-validation';
import {
  detectCharacterScript,
  detectRtlText,
  CharacterScriptAnalysis,
} from './pdf-parser-text-analysis';

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
 * Encoding details interface
 */
interface EncodingDetails {
  isMultiByte: boolean;
  isLegacyEncoding: boolean;
  supportsBOM: boolean;
  endianness?: 'le' | 'be';
  encodingFamily: 'utf' | 'legacy' | 'cjk' | 'ascii';
}

/**
 * Comprehensive encoding analysis results
 */
interface EncodingAnalysis {
  encoding: string;
  confidence: number;
  hasBOM: boolean;
  isAscii: boolean;
  nonAsciiRatio: number;
  scriptAnalysis: {
    hasCjk: boolean;
    hasRtl: boolean;
    hasLatin: boolean;
    cjkRatio: number;
    rtlRatio: number;
    latinRatio: number;
    detectedScripts: string[];
  };
  rtlDetection: {
    isRtl: boolean;
    rtlRatio: number;
    hasArabic: boolean;
    hasHebrew: boolean;
    detectedScripts: string[];
  };
  encodingDetails: EncodingDetails;
}

/**
 * Diagnostic report interface
 */
interface DiagnosticReport {
  encoding: string;
  confidence: number;
  scriptAnalysis: object;
  rtlDetection: object;
  validation: {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
  };
  recommendations: string[];
  supportedEncodings: readonly string[];
}

/**
 * Determines encoding details from encoding name
 * @param {string} encoding - Encoding name
 * @returns {EncodingDetails} Encoding details object
 */
function determineEncodingDetails(encoding: string): EncodingDetails {
  const isMultiByte = ['utf-16le', 'utf-16be', 'utf-32le', 'utf-32be'].includes(
    encoding
  );
  const isLegacyEncoding = LEGACY_ENCODINGS.includes(
    encoding as (typeof LEGACY_ENCODINGS)[number]
  );
  const supportsBOM = encoding.startsWith('utf-');
  let endianness: 'le' | 'be' | undefined;
  if (encoding.includes('le')) endianness = 'le';
  else if (encoding.includes('be')) endianness = 'be';

  let encodingFamily: 'utf' | 'legacy' | 'cjk' | 'ascii';
  if (encoding === 'ascii') encodingFamily = 'ascii';
  else if (CJK_ENCODINGS.includes(encoding as (typeof CJK_ENCODINGS)[number]))
    encodingFamily = 'cjk';
  else if (isLegacyEncoding) encodingFamily = 'legacy';
  else encodingFamily = 'utf';

  return {
    isMultiByte,
    isLegacyEncoding,
    supportsBOM,
    endianness,
    encodingFamily,
  };
}

/**
 * Adds script-based recommendations
 * @param {object} scriptAnalysis - Script analysis results
 * @param {boolean} scriptAnalysis.hasCjk - Whether CJK characters are detected
 * @param {boolean} scriptAnalysis.hasRtl - Whether RTL text is detected
 * @param {string[]} recommendations - Recommendations array to append to
 */
function addScriptRecommendations(
  scriptAnalysis: { hasCjk: boolean; hasRtl: boolean },
  recommendations: string[]
): void {
  if (scriptAnalysis.hasCjk)
    recommendations.push(
      'Consider using UTF-8 or encoding-specific CJK encoding (GB2312, Shift_JIS, EUC-KR, Big5)'
    );
  if (scriptAnalysis.hasRtl)
    recommendations.push(
      'RTL text detected - ensure proper text direction handling in rendering'
    );
}

/**
 * Extracts detected script names from analysis results
 * @param {object} scriptAnalysis - Script analysis object
 * @param {boolean} scriptAnalysis.hasLatin - Whether Latin characters are detected
 * @param {boolean} scriptAnalysis.hasCjk - Whether CJK characters are detected
 * @param {boolean} scriptAnalysis.hasRtl - Whether RTL text is detected
 * @returns {string[]} Array of detected script names
 */
function extractDetectedScripts(scriptAnalysis: {
  hasLatin: boolean;
  hasCjk: boolean;
  hasRtl: boolean;
}): string[] {
  const detectedScripts: string[] = [];
  if (scriptAnalysis.hasLatin) detectedScripts.push('Latin');
  if (scriptAnalysis.hasCjk) detectedScripts.push('CJK');
  if (scriptAnalysis.hasRtl) detectedScripts.push('RTL');
  return detectedScripts;
}

/**
 * Analyzes text encoding with detailed confidence scoring.
 * Enhanced with comprehensive script and encoding support.
 * @param {string} text - Text to analyze
 * @returns {EncodingAnalysis} Comprehensive encoding analysis results
 */
export function analyzeTextEncoding(text: string): EncodingAnalysis {
  const encoding = detectEncoding(text);
  const confidence = calculateEncodingConfidence(text);
  const bom = hasBOM(text);
  const isAscii = !text.match(/[^0-\\x]/);
  const scriptAnalysis = detectCharacterScript(text);
  const rtlDetection = detectRtlText(text);
  const nonAsciiCount = [...text].reduce(
    (count, char) =>
      count + (char.charCodeAt(0) >= ASCII_CHARACTER_RANGE_MAX ? 1 : 0),
    0
  );
  const encodingDetails = determineEncodingDetails(encoding);
  const detectedScripts = extractDetectedScripts(scriptAnalysis);

  return {
    encoding,
    confidence,
    hasBOM: bom,
    isAscii,
    nonAsciiRatio: text.length > 0 ? nonAsciiCount / text.length : 0,
    scriptAnalysis: {
      ...scriptAnalysis,
      detectedScripts,
    },
    rtlDetection,
    encodingDetails,
  };
}

/**
 * Provides comprehensive encoding diagnostics
 * @param {string} text - Text to analyze
 * @returns {DiagnosticReport} Complete diagnostic report
 */
export function getEncodingDiagnostics(text: string): DiagnosticReport {
  const encoding = detectEncoding(text);
  const confidence = calculateEncodingConfidence(text);
  const scriptAnalysis = detectCharacterScript(text);
  const rtlDetection = detectRtlText(text);
  const validation = validateAdvancedEncodingDetection(
    text,
    encoding,
    confidence
  );
  const recommendations = buildRecommendations(
    scriptAnalysis,
    validation,
    confidence
  );

  return {
    encoding,
    confidence,
    scriptAnalysis,
    rtlDetection,
    validation: {
      isValid: validation.isValid,
      issues: validation.issues,
      warnings: validation.warnings,
      recommendations: validation.recommendations,
    },
    recommendations,
    supportedEncodings: SUPPORTED_ENCODINGS,
  };
}

/**
 * Builds recommendation list based on analysis
 * @param {CharacterScriptAnalysis} scriptAnalysis - Character script analysis
 * @param {ValidationResult} validation - Encoding validation results
 * @param {number} confidence - Detection confidence score
 * @returns {string[]} Array of recommendation strings
 */
function buildRecommendations(
  scriptAnalysis: CharacterScriptAnalysis,
  validation: ValidationResult,
  confidence: number
): string[] {
  const recommendations: string[] = [];
  addScriptRecommendations(scriptAnalysis, recommendations);

  if (validation.warnings.length > 0) {
    recommendations.push(...validation.recommendations);
  }

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    recommendations.push(
      'Low confidence detection - consider manual encoding specification'
    );
  }

  return recommendations;
}
