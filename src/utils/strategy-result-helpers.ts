import { failure, type Result, BunTtsBaseError } from '../errors/index';

/**
 * Creates attempt result object for recovery failure
 * @param {BunTtsBaseError} error - The error that caused failure
 * @param {boolean} shouldBreak - Whether to break the retry loop
 * @returns {{ success: boolean; result: Result<never, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }} Failure result
 */
export const createFailureResult = (
  error: BunTtsBaseError,
  shouldBreak: boolean
): {
  success: false;
  result: Result<never, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} => ({
  success: false as const,
  result: failure(error),
  error,
  shouldBreak,
});

/**
 * Creates attempt result object for successful recovery
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }} Success result
 */
export const createSuccessResult = <T>(
  result: Result<T, BunTtsBaseError>
): {
  success: true;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} => ({
  success: true as const,
  result,
  error:
    result.error ??
    new BunTtsBaseError(
      'Unknown error in success result',
      'UNKNOWN_ERROR',
      'validation'
    ),
  shouldBreak: false as const,
});
