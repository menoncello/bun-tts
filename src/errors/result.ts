import { BunTtsError } from './bun-tts-error.js';

/**
 * Result type for functional error handling.
 * Represents either a successful operation with data or a failed operation with an error.
 * This pattern enables explicit error handling without throwing exceptions.
 *
 * @template T - The type of the success value
 * @template E - The type of the error, defaults to BunTtsError
 */
export type Result<T, E extends BunTtsError = BunTtsError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful result containing the provided data.
 *
 * @template T - The type of the data
 * @param {T} data - The success value to wrap in a Result
 * @returns {Result<T>} A Result representing success
 */
export function Ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Creates an error result containing the provided error.
 *
 * @template E - The type of the error
 * @param {E} error - The error to wrap in a Result
 * @returns {Result<never, E>} A Result representing failure
 */
export function Err<E extends BunTtsError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Maps over a successful result, applying a transformation function to the data.
 * If the result is an error, it passes through unchanged.
 *
 * @template T - The original data type
 * @template U - The transformed data type
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to map over
 * @param {(value: T) => U} fn - The transformation function to apply to successful data
 * @returns {Result<U, E>} A new Result with transformed data or the original error
 */
export function map<T, U, E extends BunTtsError>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return Ok(fn(result.data)) as Result<U, E>;
  }
  return result as Result<U, E>;
}

/**
 * Chains operations on results, allowing sequential operations that may fail.
 * If the result is successful, applies the function that returns a new Result.
 * If the result is an error, it passes through unchanged.
 *
 * @template T - The original data type
 * @template U - The new data type
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to chain operations on
 * @param {(value: T) => Result<U, E>} fn - A function that takes successful data and returns a new Result
 * @returns {Result<U, E>} A new Result from the chained operation or the original error
 */
export function chain<T, U, E extends BunTtsError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result as Result<U, E>;
}

/**
 * Handles both success and error cases by applying the appropriate function.
 * This is similar to pattern matching in functional programming languages.
 *
 * @template T - The success data type
 * @template U - The result type
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to match against
 * @param {(value: T) => U} onSuccess - Function to apply when the Result is successful
 * @param {(error: E) => U} onError - Function to apply when the Result is an error
 * @returns {U} The result of applying the appropriate function
 */
export function match<T, U, E extends BunTtsError>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U
): U {
  if (result.success) {
    return onSuccess(result.data);
  }
  return onError((result as { success: false; error: E }).error);
}

/**
 * Extracts the value from a successful result or throws the error if it's a failure.
 * This is useful when you're certain the result will be successful or want to
 * let errors propagate as exceptions.
 *
 * @template T - The success data type
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to unwrap
 * @returns {T} The data if the result is successful
 * @throws {E} The error if the result is a failure
 */
export function unwrap<T, E extends BunTtsError>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw (result as { success: false; error: E }).error;
}

/**
 * Extracts the value from a successful result or returns a default value if it's a failure.
 * This provides a safe way to get data from a Result without throwing exceptions.
 *
 * @template T - The success data type
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to unwrap
 * @param {T} defaultValue - The default value to return if the result is a failure
 * @returns {T} The data if the result is successful, otherwise the default value
 */
export function unwrapOr<T, E extends BunTtsError>(
  result: Result<T, E>,
  defaultValue: T
): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}
