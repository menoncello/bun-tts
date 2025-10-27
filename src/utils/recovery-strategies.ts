import { configManager } from '../config/index.js';
import { success, failure, type Result } from '../errors/index.js';
import type { BunTtsError } from '../types/index.js';
import { debugManager } from './debug.js';
import type { RecoveryStrategy } from './error-recovery.js';

/** Delay for file system recovery attempts in milliseconds */
const FILE_SYSTEM_RETRY_DELAY = 500;

/** Delay for network recovery attempts in milliseconds */
const NETWORK_RETRY_DELAY = 1000;

/**
 * Recovery strategy for configuration-related errors
 * Attempts to reload configuration or fall back to defaults
 */
export class ConfigurationRecoveryStrategy implements RecoveryStrategy {
  /**
   * Determines if this strategy can recover from the given error
   * @param error - The error to check
   * @returns True if the error is a recoverable configuration error
   */
  canRecover(error: BunTtsError): boolean {
    return error.category === 'configuration' && error.recoverable;
  }

  /**
   * Attempts to recover from a configuration error by reloading config or using defaults
   * @param error - The configuration error to recover from
   * @param _context - Recovery context (not used in this strategy)
   * @returns Result of the recovery attempt
   */
  async recover(
    error: BunTtsError,
    _context?: Record<string, unknown>
  ): Promise<Result<unknown, BunTtsError>> {
    debugManager().debug('Attempting configuration recovery', {
      error: error.message,
    });

    try {
      // Try to reload configuration
      const configResult = await new configManager().reloadConfig();
      if (configResult.success) {
        debugManager().info('Configuration reloaded successfully');
        return success(configResult.data);
      }

      // Try to load default configuration
      const defaultResult = await new configManager().loadConfig({});
      if (defaultResult.success) {
        debugManager().info('Using default configuration');
        return success(defaultResult.data);
      }
    } catch (recoveryError) {
      debugManager().warn('Configuration recovery failed', {
        error: String(recoveryError),
      });
    }

    return failure(error);
  }
}

/**
 * Recovery strategy for file system-related errors
 * Attempts to recover by retrying file access after a delay
 */
export class FileSystemRecoveryStrategy implements RecoveryStrategy {
  /**
   * Determines if this strategy can recover from the given error
   * @param error - The error to check
   * @returns True if the error is a recoverable file system error
   */
  canRecover(error: BunTtsError): boolean {
    return error.category === 'file' && error.recoverable;
  }

  /**
   * Attempts to recover from a file system error by retrying file access
   * @param error - The file system error to recover from
   * @param _context - Recovery context (not used in this strategy)
   * @returns Result of the recovery attempt
   */
  async recover(
    error: BunTtsError,
    _context?: Record<string, unknown>
  ): Promise<Result<unknown, BunTtsError>> {
    debugManager().debug('Attempting file system recovery', {
      error: error.message,
    });

    const details = error.details as Record<string, unknown> | undefined;
    const filePath = details?.filePath as string | undefined;

    if (!filePath) {
      return failure(error);
    }

    try {
      // Wait a moment and try again
      await new Promise((resolve) =>
        setTimeout(resolve, FILE_SYSTEM_RETRY_DELAY)
      );

      // Check if file exists now
      const fs = await import('fs/promises');
      await fs.access(filePath);

      debugManager().info(`File system recovery successful: ${filePath}`);
      return success(filePath);
    } catch (recoveryError) {
      debugManager().warn('File system recovery failed', {
        filePath,
        error: String(recoveryError),
      });
      return failure(error);
    }
  }
}

/**
 * Recovery strategy for network-related errors
 * Attempts to recover by implementing a simple retry delay
 */
export class NetworkRecoveryStrategy implements RecoveryStrategy {
  /**
   * Determines if this strategy can recover from the given error
   * @param error - The error to check
   * @returns True if the error is a recoverable network/TTS error
   */
  canRecover(error: BunTtsError): boolean {
    return error.category === 'tts' && error.recoverable;
  }

  /**
   * Attempts to recover from a network error by implementing a retry delay
   * @param error - The network error to recover from
   * @param _context - Recovery context (not used in this strategy)
   * @returns Result of the recovery attempt
   */
  async recover(
    error: BunTtsError,
    _context?: Record<string, unknown>
  ): Promise<Result<unknown, BunTtsError>> {
    debugManager().debug('Attempting network recovery', {
      error: error.message,
    });

    // Simple retry strategy for network-related errors
    await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY));

    debugManager().info('Network recovery attempt completed');
    return success({ recovered: true });
  }
}
