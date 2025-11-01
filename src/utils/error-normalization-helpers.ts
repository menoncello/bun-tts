import { BunTtsBaseError } from '../errors/index';

/**
 * Normalizes various error types into a standardized BunTtsBaseError format
 * @param {unknown} error - The error to normalize
 * @returns {BunTtsBaseError} A standardized BunTtsBaseError object
 */
export const normalizeError = (error: unknown): BunTtsBaseError => {
  if (isBunTtsBaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return normalizeStandardError(error);
  }

  return normalizeUnknownError(error);
};

/**
 * Normalizes a standard JavaScript Error into BunTtsBaseError format
 * @param {Error} error - The standard JavaScript error to normalize
 * @returns {BunTtsBaseError} A normalized BunTtsBaseError
 */
export const normalizeStandardError = (error: Error): BunTtsBaseError => {
  return new BunTtsBaseError(error.message, 'UNKNOWN_ERROR', 'validation', {
    details: {
      originalError: error.constructor.name,
      stack: error.stack,
    },
    recoverable: true,
  });
};

/**
 * Normalizes an unknown error type into BunTtsBaseError format
 * @param {unknown} error - The unknown error to normalize
 * @returns {BunTtsBaseError} A normalized BunTtsBaseError
 */
export const normalizeUnknownError = (error: unknown): BunTtsBaseError => {
  const errorMessage = String(error);
  return new BunTtsBaseError(errorMessage, 'UNKNOWN_ERROR', 'validation', {
    details: {
      type: typeof error,
      value: error,
    },
    recoverable: true,
  });
};

/**
 * Type guard to check if an error is a BunTtsBaseError
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a BunTtsBaseError
 */
export const isBunTtsBaseError = (error: unknown): error is BunTtsBaseError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'message' in error &&
    'code' in error &&
    'category' in error &&
    'recoverable' in error
  );
};
