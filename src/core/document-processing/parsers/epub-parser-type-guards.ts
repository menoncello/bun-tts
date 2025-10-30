/**
 * Type guards for ParseResult error handling
 * Provides safe access to error properties
 */

import type { ParseResult } from '../types.js';

/**
 * Type guard to check if error has 'code' property
 * @param {Error} error - The error object to check
 * @returns {boolean} boolean {True if the error has a non-empty string 'code' property, false otherwise}
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard to check if error has 'recoverable' property
 * @param {Error} error - The error object to check
 * @returns {boolean} boolean {True if the error has a boolean 'recoverable' property, false otherwise}
 */
export function hasRecoverableProperty(
  error: unknown
): error is { recoverable: boolean } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'recoverable' in error &&
    typeof (error as { recoverable: unknown }).recoverable === 'boolean'
  );
}

/**
 * Type guard to check if error is an Error instance
 * @param {Error} error - The error object to check
 * @returns {boolean} boolean {True if the error is an instance of Error, false otherwise}
 */
export function isErrorInstance(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Check if an object has a valid message property
 * @param {unknown} obj - The object to check
 * @returns {boolean} True if the object has a valid string message property
 */
function hasValidMessageProperty(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as { message: unknown }).message === 'string'
  );
}

/**
 * Check if an object has a valid code property
 * @param {unknown} obj - The object to check
 * @returns {boolean} True if the object has a valid string code property
 */
function hasValidCodeProperty(obj: unknown): obj is { code: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    typeof (obj as { code: unknown }).code === 'string'
  );
}

/**
 * Check if an object has a valid recoverable property
 * @param {unknown} obj - The object to check
 * @returns {boolean} True if the object has a valid boolean recoverable property
 */
function hasValidRecoverableProperty(
  obj: unknown
): obj is { recoverable: boolean } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'recoverable' in obj &&
    typeof (obj as { recoverable: unknown }).recoverable === 'boolean'
  );
}

/**
 * Check if an Error instance has structured properties
 * @param {Error} error - The Error instance to check
 * @returns {boolean} True if the Error has required structured properties
 */
function isErrorInstanceStructured(error: Error): boolean {
  return hasValidCodeProperty(error) && hasValidRecoverableProperty(error);
}

/**
 * Check if a plain object has structured properties
 * @param {unknown} obj - The object to check
 * @returns {boolean} True if the object has required structured properties
 */
function isPlainObjectStructured(obj: unknown): boolean {
  return hasValidCodeProperty(obj) && hasValidRecoverableProperty(obj);
}

/**
 * Type guard to check if error is a structured error object
 * @param {Error} error - The error object to check
 * @returns {object} object {True if the error is a structured error object with a message property, false otherwise}
 */
export function isStructuredError(error: unknown): error is {
  message: string;
  code?: string;
  stack?: string;
  recoverable?: boolean;
} {
  if (!hasValidMessageProperty(error)) {
    return false;
  }

  // For Error instances, they are considered structured if they have code and recoverable properties
  if (error instanceof Error) {
    return isErrorInstanceStructured(error);
  }

  // For plain objects, they must have code, message, and recoverable properties
  return isPlainObjectStructured(error);
}

/**
 * Type guard to check if ParseResult has structured error with code property
 * @param {any} result - The ParseResult to check
 * @returns {boolean} boolean {True if the ParseResult has an error with a code property, false otherwise}
 */
export function hasParseResultWithErrorCode(
  result: ParseResult
): result is ParseResult & { error: { code: string } } {
  return (
    !result.success &&
    result.error !== undefined &&
    hasErrorCode(result.error) &&
    result.error.code.length > 0
  );
}

/**
 * Type guard to check if ParseResult has structured error with recoverable property
 * @param {any} result - The ParseResult to check
 * @returns {boolean} boolean {True if the ParseResult has an error with a recoverable property, false otherwise}
 */
export function hasParseResultWithRecoverable(
  result: ParseResult
): result is ParseResult & { error: { recoverable: boolean } } {
  return (
    result.error !== undefined &&
    hasRecoverableProperty(result.error) &&
    result.error.recoverable === true
  );
}

/**
 * Type guard to check if ParseResult has Error instance
 * @param {any} result - The ParseResult to check
 * @returns {boolean} boolean {True if the ParseResult has an Error instance, false otherwise}
 */
export function hasParseResultWithErrorInstance(
  result: ParseResult
): result is ParseResult & { error: Error } {
  return result.error !== undefined && isErrorInstance(result.error);
}

/**
 * Type guard to check if error has minimal structured properties (code + message)
 * Used for ParseResult checks where minimal structured errors are acceptable
 * @param {Error} error - The error object to check
 * @returns {object} object {True if the error has code and message properties, false otherwise}
 */
function hasMinimalStructuredProperties(error: unknown): error is {
  message: string;
  code?: string;
  stack?: string;
  recoverable?: boolean;
} {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  // Must have a message property
  if (
    !('message' in error) ||
    typeof (error as { message: unknown }).message !== 'string'
  ) {
    return false;
  }

  // Must have a code property
  if (
    !('code' in error) ||
    typeof (error as { code: unknown }).code !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if ParseResult has structured error
 * @param {any} result - The ParseResult to check
 * @returns {object} object {True if the ParseResult has a structured error object, false otherwise}
 */
export function hasParseResultWithStructuredError(
  result: ParseResult
): result is ParseResult & {
  error: {
    message: string;
    code?: string;
    stack?: string;
    recoverable?: boolean;
  };
} {
  return (
    result.error !== undefined && hasMinimalStructuredProperties(result.error)
  );
}

/**
 * Safely get error code from error object
 * @param {Error} error - The error object to extract the code from
 * @returns {unknown} * The error code if present, null otherwise
 */
export function getErrorCode(error: unknown): string | null {
  if (hasErrorCode(error) && error.code.length > 0) {
    return error.code;
  }
  return null;
}

/**
 * Safely get recoverable flag from error object
 * @param {Error} error - The error object to extract the recoverable flag from
 * @returns {boolean | null} The recoverable flag if present, null otherwise
 */
export function getErrorRecoverable(error: unknown): boolean | null {
  // Return null for null or undefined input
  if (error === null || error === undefined) {
    return null;
  }

  // Return null for non-object types
  if (typeof error !== 'object') {
    return null;
  }

  if (hasRecoverableProperty(error)) {
    return error.recoverable;
  }

  // Return null for errors without recoverable property
  return null;
}

/**
 * Safely get error message from error object
 * @param {Error} error - The error object to extract the message from
 * @returns {unknown} * The error message if present, null otherwise
 */
export function getErrorMessage(error: unknown): string | null {
  if (isNullish(error)) {
    return null;
  }

  return extractErrorMessage(error);
}

/**
 * Check if error is null or undefined
 * @param {Error} error - The error to check
 * @returns {boolean} boolean {True if null or undefined, false otherwise}
 */
function isNullish(error: unknown): error is null | undefined {
  return error === null || error === undefined;
}

/**
 * Extract error message using available strategies
 * @param {Error} error - The error object to extract message from
 * @returns {unknown} * The error message if found, null otherwise
 */
function extractErrorMessage(error: unknown): string | null {
  const strategies = [
    getErrorInstanceMessage,
    getCustomToStringResult,
    getArrayOrPrimitiveMessage,
  ];

  for (const strategy of strategies) {
    const result = strategy(error);
    if (result !== null) {
      return result;
    }
  }

  return null;
}

/**
 * Get message from Error instances or structured errors
 * @param {Error} error - The error object to check
 * @returns {unknown} unknown {Error message if available, null otherwise}
 */
function getErrorInstanceMessage(error: unknown): string | null {
  if (isErrorInstance(error)) {
    return error.message;
  }

  if (isStructuredError(error)) {
    return error.message;
  }

  if (hasMessageProperty(error)) {
    return error.message;
  }

  return null;
}

/**
 * Get result from custom toString method
 * @param {Error} error - The error object to check
 * @returns {string} string {Custom string result if available, null otherwise}
 */
function getCustomToStringResult(error: unknown): string | null {
  if (hasCustomToString(error)) {
    try {
      const stringResult = error.toString();
      return stringResult === '[object Object]' ? null : stringResult;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get message from arrays or primitive values
 * @param {Error} error - The error object to convert
 * @returns {unknown} unknown {String representation or null if conversion fails}
 */
function getArrayOrPrimitiveMessage(error: unknown): string | null {
  if (Array.isArray(error)) {
    return error.join(',');
  }

  return convertToString(error);
}

/**
 * Check if error has a message property
 * @param {Error} error - The error object to check
 * @returns {boolean} boolean {True if the error has a string message property, false otherwise}
 */
function hasMessageProperty(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Check if error has a custom toString method
 * @param {Error} error - The error object to check
 * @returns {boolean} boolean {True if the error has a custom toString method, false otherwise}
 */
function hasCustomToString(
  error: unknown
): error is { toString: () => string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'toString' in error &&
    typeof (error as { toString: unknown }).toString === 'function'
  );
}

/**
 * Convert value to string safely
 * @param {any} value - The value to convert
 * @returns {unknown} unknown {String representation or null if conversion fails}
 */
function convertToString(value: unknown): string | null {
  try {
    return String(value);
  } catch {
    return null;
  }
}
