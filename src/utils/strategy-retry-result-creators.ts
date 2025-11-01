import { failure, type Result, BunTtsBaseError } from '../errors/index';

/**
 * Creates successful iteration execution result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @param {BunTtsBaseError} error - The error (if any)
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError; shouldContinue: boolean }} Success result
 */
export const createSuccessIterationExecutionResult = <T>(
  result: Result<T, BunTtsBaseError>,
  error: BunTtsBaseError
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
  shouldContinue: boolean;
} => ({
  success: true,
  result,
  finalError: error,
  shouldContinue: false,
});

/**
 * Creates failed iteration execution result
 * @param {Result<T, BunTtsBaseError>} result - The failed result
 * @param {BunTtsBaseError} error - The error
 * @param {boolean} shouldContinue - Whether to continue
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError; shouldContinue: boolean }} Failure result
 */
export const createFailureIterationExecutionResult = <T>(
  result: Result<T, BunTtsBaseError>,
  error: BunTtsBaseError,
  shouldContinue: boolean
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
  shouldContinue: boolean;
} => ({
  success: false,
  result,
  finalError: error,
  shouldContinue,
});

/**
 * Creates successful loop result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @param {BunTtsBaseError} error - The error (if any)
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }} Success result
 */
export const createSuccessLoopResult = <T>(
  result: Result<T, BunTtsBaseError>,
  error: BunTtsBaseError
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} => ({
  success: true,
  result,
  finalError: error,
});

/**
 * Creates failed loop result
 * @param {BunTtsBaseError} error - The final error
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }} Failure result
 */
export const createFailureLoopResult = <T>(
  error: BunTtsBaseError
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} => ({
  success: false,
  result: failure(error),
  finalError: error,
});
