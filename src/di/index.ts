/**
 * Dependency Injection Module Barrel Export
 *
 * This file provides a clean export interface for the DI module.
 * Import dependencies from here to maintain clean import paths.
 * It serves as the main entry point for all dependency injection functionality.
 */

import { ConfigManager } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import {
  resolve,
  container,
  diContainer,
  initializeContainer,
} from './container.js';
import {
  DIContainer,
  DEPENDENCIES,
  DependencyKey,
  DependencyType,
  ServiceLifetime,
  ServiceMetadata,
  SERVICE_REGISTRY,
} from './types.js';

// Re-export for isolatedModules compatibility
export {
  container,
  diContainer,
  resolve,
  initializeContainer,
  DEPENDENCIES,
  SERVICE_REGISTRY,
};

export type {
  DIContainer,
  DependencyKey,
  DependencyType,
  ServiceLifetime,
  ServiceMetadata,
};

/**
 * Interface defining the structure of common dependencies
 * Provides typing for frequently used services in typical operations
 */
export interface CommonDependencies {
  /** Configuration manager for application settings */
  config: ConfigManager;
  /** Logger service for application-wide logging */
  logger: Logger;
  /** TTS adapter factory (placeholder for future implementation) */
  ttsAdapterFactory: unknown;
}

/**
 * Interface defining the structure of document processing dependencies
 * Provides typing for services involved in document parsing and processing
 */
export interface DocumentProcessingDependencies {
  /** Configuration manager for application settings */
  config: ConfigManager;
  /** Logger service for application-wide logging */
  logger: Logger;
  /** Markdown parser (placeholder for future implementation) */
  markdownParser: unknown;
  /** PDF parser (placeholder for future implementation) */
  pdfParser: unknown;
  /** EPUB parser (placeholder for future implementation) */
  epubParser: unknown;
  /** Document processor (placeholder for future implementation) */
  documentProcessor: unknown;
}

/**
 * Convenience function to get all required dependencies for typical operations
 *
 * This function provides easy access to the most commonly used dependencies
 * across the application, including configuration and logging services.
 *
 * @returns {CommonDependencies} Object containing common dependencies
 *
 * @example
 * ```typescript
 * const { config, logger } = getCommonDependencies();
 * logger.info('Application started', { version: config.get('version') });
 * ```
 */
export const _getCommonDependencies = (): CommonDependencies => {
  return {
    config: resolve(DEPENDENCIES.CONFIG_MANAGER),
    logger: resolve(DEPENDENCIES.LOGGER),
    // Note: TTS adapter factory will be implemented in future iterations
    ttsAdapterFactory: null as unknown,
  };
};

/**
 * Convenience function for document processing dependencies
 *
 * This function provides access to all dependencies required for document
 * processing operations, including parsers for various document formats.
 *
 * @returns {DocumentProcessingDependencies} Object containing document processing dependencies
 *
 * @example
 * ```typescript
 * const { config, logger, markdownParser } = getDocumentProcessingDependencies();
 * logger.info('Processing document', { parser: 'markdown' });
 * ```
 */
export const _getDocumentProcessingDependencies =
  (): DocumentProcessingDependencies => {
    return {
      config: resolve(DEPENDENCIES.CONFIG_MANAGER),
      logger: resolve(DEPENDENCIES.LOGGER),
      // Note: These parsers will be implemented in future iterations
      markdownParser: null as unknown,
      pdfParser: null as unknown,
      epubParser: null as unknown,
      documentProcessor: null as unknown,
    };
  };
