/**
 * Encoding conversion utilities for PDF parser.
 * Handles text encoding conversion with fallback strategies.
 */

import {
  detectEncoding,
  calculateEncodingConfidence,
  hasBOM,
} from './pdf-parser-encoding-detection';

/**
 * Conversion options
 */
interface ConversionOptions {
  attemptAutoDetection?: boolean;
  fallbackEncodings?: string[];
}

/**
 * Conversion result
 */
interface ConversionResult {
  success: boolean;
  convertedText: string;
  actualFromEncoding: string;
  actualToEncoding: string;
  usedFallback: boolean;
  confidence: number;
  errors: string[];
}

/**
 * Handles basic encoding conversion
 * @param {string} text - Text to convert
 * @param {string} fromEncoding - Source encoding
 * @param {string} toEncoding - Target encoding
 * @returns {{success: boolean; convertedText: string}} Conversion success status
 */
function performBasicConversion(
  text: string,
  fromEncoding: string,
  toEncoding: string
): { success: boolean; convertedText: string } {
  if (fromEncoding === toEncoding) {
    return { success: true, convertedText: text };
  }

  // Handle BOM removal
  let convertedText = text;
  if (fromEncoding.includes('utf-8') && hasBOM(text)) {
    convertedText = text.slice(1);
  }

  return { success: true, convertedText };
}

/**
 * Handles encoding conversion with auto-detection
 * @param {string} text - Text to convert
 * @param {string} fromEncoding - Source encoding
 * @param {boolean} attemptAutoDetection - Whether to attempt auto-detection
 * @returns {string} Actual encoding used
 */
function resolveEncoding(
  text: string,
  fromEncoding: string,
  attemptAutoDetection?: boolean
): string {
  if (attemptAutoDetection) {
    return detectEncoding(text);
  }
  return fromEncoding;
}

/**
 * Handles BOM removal from text
 * @param {string} text - Text to process
 * @param {string} fromEncoding - Source encoding
 * @returns {string} Text with BOM removed if present
 */
function removeBomIfPresent(text: string, fromEncoding: string): string {
  if (fromEncoding.includes('utf-8') && hasBOM(text)) {
    return text.slice(1);
  }
  return text;
}

/**
 * Attempts fallback encodings
 * @param {string} text - Text to convert
 * @param {string[]} fallbackEncodings - List of fallback encodings
 * @param {string} toEncoding - Target encoding
 * @param {string[]} currentErrors - Current error list
 * @returns {ConversionResult | null} Conversion result or null if all fallbacks fail
 */
function tryFallbackEncodings(
  text: string,
  fallbackEncodings: string[],
  toEncoding: string,
  currentErrors: string[]
): ConversionResult | null {
  for (const fallbackEncoding of fallbackEncodings) {
    try {
      const convertedText = performBasicConversion(
        text,
        fallbackEncoding,
        toEncoding
      ).convertedText;
      return {
        success: true,
        convertedText,
        actualFromEncoding: fallbackEncoding,
        actualToEncoding: toEncoding,
        usedFallback: true,
        confidence: 0.5,
        errors: currentErrors,
      };
    } catch (fallbackError) {
      currentErrors.push(
        `Fallback conversion failed: ${(fallbackError as Error).message}`
      );
    }
  }
  return null;
}

/**
 * Attempts encoding conversion with fallback strategies
 * @param {string} text - Text to convert
 * @param {string} fromEncoding - Source encoding
 * @param {string} toEncoding - Target encoding (default: 'utf-8')
 * @param {ConversionOptions} options - Conversion options
 * @returns {ConversionResult} Conversion result with fallback information
 */
export function convertTextEncodingWithFallback(
  text: string,
  fromEncoding: string,
  toEncoding = 'utf-8',
  options: ConversionOptions = {}
): ConversionResult {
  const errors: string[] = [];
  const actualFromEncoding = resolveEncoding(
    text,
    fromEncoding,
    options.attemptAutoDetection
  );

  // Attempt conversion
  try {
    return attemptConversion(text, actualFromEncoding, toEncoding, errors);
  } catch (error) {
    const context: ConversionContext = {
      text,
      actualFromEncoding,
      toEncoding,
      fallbackEncodings: options.fallbackEncodings,
      errors,
    };
    return handleConversionFailure(context, error);
  }
}

/**
 * Performs the actual text conversion
 * @param {string} text - Text to convert
 * @param {string} actualFromEncoding - Source encoding
 * @param {string} toEncoding - Target encoding
 * @param {string[]} errors - Error list to append to
 * @returns {ConversionResult} Successful conversion result
 */
function attemptConversion(
  text: string,
  actualFromEncoding: string,
  toEncoding: string,
  errors: string[]
): ConversionResult {
  const convertedText = removeBomIfPresent(text, actualFromEncoding);
  const confidence = calculateEncodingConfidence(text);

  return {
    success: true,
    convertedText,
    actualFromEncoding,
    actualToEncoding: toEncoding,
    usedFallback: false,
    confidence,
    errors,
  };
}

/**
 * Conversion context for handling failures
 */
interface ConversionContext {
  text: string;
  actualFromEncoding: string;
  toEncoding: string;
  fallbackEncodings?: string[];
  errors: string[];
}

/**
 * Handles conversion failure and attempts fallback
 * @param {ConversionContext} context - Conversion context
 * @param {unknown} error - The error that occurred
 * @returns {ConversionResult} Final conversion result
 */
function handleConversionFailure(
  context: ConversionContext,
  error: unknown
): ConversionResult {
  context.errors.push(`Conversion failed: ${(error as Error).message}`);

  // Try fallback encodings
  if (context.fallbackEncodings) {
    const fallbackResult = tryFallbackEncodings(
      context.text,
      context.fallbackEncodings,
      context.toEncoding,
      context.errors
    );
    if (fallbackResult) {
      return fallbackResult;
    }
  }

  return createFailureResult(
    context.text,
    context.actualFromEncoding,
    context.toEncoding,
    context.errors
  );
}

/**
 * Creates a failure result object
 * @param {string} text - Original text
 * @param {string} actualFromEncoding - Source encoding
 * @param {string} toEncoding - Target encoding
 * @param {string[]} errors - Error list
 * @returns {ConversionResult} Failure result
 */
function createFailureResult(
  text: string,
  actualFromEncoding: string,
  toEncoding: string,
  errors: string[]
): ConversionResult {
  return {
    success: false,
    convertedText: text,
    actualFromEncoding,
    actualToEncoding: toEncoding,
    usedFallback: false,
    confidence: 0,
    errors,
  };
}

/**
 * Converts text encoding from one format to another
 * @param {string} text - Text to convert
 * @param {string} fromEncoding - Source encoding
 * @param {string} toEncoding - Target encoding (default: 'utf-8')
 * @returns {string} Converted text
 */
export function convertTextEncoding(
  text: string,
  fromEncoding: string,
  toEncoding = 'utf-8'
): string {
  if (fromEncoding === toEncoding) {
    return text;
  }

  return removeBomIfPresent(text, fromEncoding);
}
