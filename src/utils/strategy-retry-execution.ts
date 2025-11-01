/**
 * Strategy Retry Execution - Main Module
 *
 * This file serves as the main entry point for strategy retry execution functionality.
 * The implementation has been refactored into smaller, focused modules to meet
 * ESLint max-lines requirements while maintaining all existing functionality.
 */

// Re-export createSuccessResult for backward compatibility
export { createSuccessResult } from './strategy-retry-helpers';

// Re-export main API function
export { attemptStrategyWithRetries } from './strategy-retry-main-api';
