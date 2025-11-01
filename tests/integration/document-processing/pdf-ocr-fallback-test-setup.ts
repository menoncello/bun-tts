/**
 * Test setup utilities for PDF OCR fallback integration tests.
 * Provides common configuration and parser creation functions.
 */

import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import { ConfigManager } from '../../../src/config/config-manager';
import { PDFParser } from '../../../src/core/document-processing/parsers/pdf-parser';

/**
 * Creates a configured PDF parser with OCR capabilities.
 * @param {number} confidenceThreshold - OCR confidence threshold
 * @returns {Promise<PDFParser>} Configured PDF parser
 */
export async function createOCRParser(
  confidenceThreshold = 0.6
): Promise<PDFParser> {
  const configManager = new ConfigManager();
  await configManager.load();
  const logger = new PinoLoggerAdapter();

  const ocrConfig = {
    maxFileSize: 50 * 1024 * 1024,
    confidenceThreshold,
    extractImages: true,
    extractTables: true,
  };

  return new PDFParser(logger, configManager, ocrConfig);
}

/**
 * Creates a PDF parser with custom OCR configuration.
 * @param {unknown} customConfig - Custom OCR configuration
 * @returns {Promise<PDFParser>} Configured PDF parser
 */
export async function createCustomOCRParser(
  customConfig: any
): Promise<PDFParser> {
  const configManager = new ConfigManager();
  await configManager.load();
  const logger = new PinoLoggerAdapter();

  const defaultConfig = {
    maxFileSize: 50 * 1024 * 1024,
    confidenceThreshold: 0.6,
    extractImages: true,
    extractTables: true,
  };

  const finalConfig = { ...defaultConfig, ...customConfig };
  return new PDFParser(logger, configManager, finalConfig);
}

/**
 * Standard OCR configurations for different test scenarios.
 */
export const OCR_CONFIGS = {
  BASIC: { confidenceThreshold: 0.6 },
  TEXT_EXTRACTION: { confidenceThreshold: 0.5 },
  STRUCTURE_PRESERVATION: { confidenceThreshold: 0.6 },
  ERROR_HANDLING: { confidenceThreshold: 0.4 },
  METADATA_TRACKING: { confidenceThreshold: 0.6 },
  HYBRID_PROCESSING: { confidenceThreshold: 0.7 },
  FORMATTING_SUPPORT: { confidenceThreshold: 0.6 },
} as const;
