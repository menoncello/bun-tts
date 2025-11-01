/**
 * Configuration utilities for Markdown parser.
 * Handles configuration loading, validation, and parser setup.
 */

import { marked } from 'marked';
import type { ConfigManager } from '../../../config/config-manager.js';
import type { Logger } from '../../../interfaces/logger.js';
import {
  type MarkdownParserConfig,
  DEFAULT_MARKDOWN_PARSER_CONFIG,
} from '../config/markdown-parser-config.js';
import { MarkdownParseError } from '../errors/markdown-parse-error.js';
import type { DocumentStructure } from '../types.js';

/** Constants for parser operations */
const KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = KILOBYTE * KILOBYTE;

/**
 * Load configuration from ConfigManager
 * @param {ConfigManager} configManager - The configuration manager instance
 * @param {Logger} logger - The logger instance for error reporting
 * @returns {MarkdownParserConfig} The loaded markdown parser configuration
 */
export const loadConfiguration = (
  configManager: ConfigManager,
  logger: Logger
): MarkdownParserConfig => {
  try {
    const config = configManager.get(
      'markdownParser',
      DEFAULT_MARKDOWN_PARSER_CONFIG
    );
    if (!config || Object.keys(config).length === 0) {
      logger?.error('Failed to load Markdown parser config, using defaults', {
        reason: config
          ? 'config is empty object'
          : 'config is null or undefined',
        defaultConfig: DEFAULT_MARKDOWN_PARSER_CONFIG,
      });
      return DEFAULT_MARKDOWN_PARSER_CONFIG;
    }
    return {
      ...DEFAULT_MARKDOWN_PARSER_CONFIG,
      ...config,
    } as MarkdownParserConfig;
  } catch (error) {
    logger?.error('Failed to load markdown parser configuration', { error });
    return DEFAULT_MARKDOWN_PARSER_CONFIG;
  }
};

/**
 * Configure marked library with custom options
 * @param {MarkdownParserConfig} _config - The markdown parser configuration (currently unused but kept for future extensibility)
 */
export const configureMarked = (_config: MarkdownParserConfig): void => {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
};

/**
 * Validate input before processing
 * @param {string|Buffer} input - The input string or Buffer to validate
 * @returns {string|MarkdownParseError} The validated string or a MarkdownParseError if invalid
 */
export const validateInput = (
  input: string | Buffer
): string | MarkdownParseError => {
  if (input === null || input === undefined) {
    return MarkdownParseError.invalidInput('undefined', 'string');
  }

  if (typeof input === 'string') {
    if (input.trim().length === 0) {
      return MarkdownParseError.invalidSyntax('Empty string content');
    }
    return input;
  }

  if (Buffer.isBuffer(input)) {
    const text = input.toString('utf-8');
    if (text.trim().length === 0) {
      return MarkdownParseError.invalidSyntax('Empty buffer content');
    }
    return text;
  }

  return MarkdownParseError.invalidInput(typeof input, 'string');
};

/**
 * Check file size limits
 * @param {string} content - The content to check
 * @param {MarkdownParserConfig} config - The parser configuration containing size limits
 * @returns {void|MarkdownParseError} Undefined if size is valid, otherwise a MarkdownParseError
 */
export const checkFileSize = (
  content: string,
  config: MarkdownParserConfig
): void | MarkdownParseError => {
  const maxSize = config.maxFileSize * BYTES_PER_MEGABYTE;
  const size = Buffer.byteLength(content, 'utf-8');
  if (size > maxSize) {
    return MarkdownParseError.fileTooLarge(size, maxSize);
  }
};

/**
 * Validate confidence threshold
 * @param {DocumentStructure} structure - The document structure to validate
 * @param {MarkdownParserConfig} config - The parser configuration containing confidence thresholds
 * @returns {DocumentStructure|MarkdownParseError} The original structure if valid, otherwise a MarkdownParseError
 */
export const validateConfidenceThreshold = (
  structure: DocumentStructure,
  config: MarkdownParserConfig
): DocumentStructure | MarkdownParseError => {
  if (structure.confidence < config.confidenceThreshold) {
    return MarkdownParseError.lowConfidence(
      structure.confidence,
      config.confidenceThreshold
    );
  }
  return structure;
};
