/**
 * Markdown parser implementation using marked library.
 * Provides structured document parsing with chapter detection and sentence boundary analysis.
 */

import type { ConfigManager } from '../../../config/config-manager.js';
import type { Result } from '../../../errors/result.js';
import type { Logger } from '../../../interfaces/logger.js';
import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import { MarkdownParseError } from '../errors/markdown-parse-error.js';
import type {
  Chapter,
  DocumentMetadata,
  DocumentStructure,
  DocumentStream,
  ParsedToken,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types.js';
import { extractChaptersFromTokens } from './chapter-extraction.js';
import { PARSER_CONSTANTS } from './constants.js';
import {
  buildDocument,
  validateAndPrepareInput,
  handleParsingError,
} from './document-builder.js';
import {
  loadConfiguration,
  configureMarked,
  tokenizeMarkdown,
} from './parser-core.js';
import { createStream } from './parser-streaming.js';
import { extractBasicMetadata } from './structure-extractor.js';
import { validateChapters } from './validation-logic.js';
import { calculateValidationScore } from './validation-utils.js';

/**
 * Markdown parser class for converting Markdown to structured document format
 */
export class MarkdownParser {
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private readonly config: MarkdownParserConfig;

  /**
   * Create a new MarkdownParser instance
   *
   * @param logger - Logger instance for structured logging
   * @param configManager - Configuration manager for parser settings
   */
  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.config = loadConfiguration(configManager, logger);
    configureMarked(this.config);

    this.logger.debug('MarkdownParser initialized', {
      chapterDetectionPattern: this.config.chapterDetectionPattern,
      confidenceThreshold: this.config.confidenceThreshold,
      enableStreaming: this.config.enableStreaming,
    });
  }

  /**
   * Parse Markdown content into structured document format
   *
   * @param input - Markdown content as string or Buffer
   * @returns Result containing DocumentStructure or MarkdownParseError
   */
  public async parse(
    input: string | Buffer
  ): Promise<Result<DocumentStructure, MarkdownParseError>> {
    const startTime = new Date();
    this.logParsingStart(input);

    try {
      const validatedContent = this.validateAndPrepareInput(input);
      if (validatedContent instanceof MarkdownParseError) {
        return { success: false, error: validatedContent };
      }

      const documentStructure = await this.buildDocumentStructure(
        validatedContent,
        startTime
      );

      if (documentStructure instanceof MarkdownParseError) {
        return { success: false, error: documentStructure };
      }

      this.logParsingSuccess(documentStructure);
      return { success: true, data: documentStructure };
    } catch (error) {
      return this.handleParsingError(error, startTime);
    }
  }

  /**
   * Build document structure from content
   *
   * @param content - Validated markdown content
   * @param startTime - Parse start time
   * @returns DocumentStructure or MarkdownParseError
   */
  private async buildDocumentStructure(
    content: string,
    startTime: Date
  ): Promise<DocumentStructure | MarkdownParseError> {
    return buildDocument(
      content,
      startTime,
      this.config,
      this.extractChaptersFromTokens.bind(this)
    );
  }

  /**
   * Validate parsed document structure
   *
   * @param structure - Document structure to validate
   * @returns Validation result with detailed information
   */
  public async validate(
    structure: DocumentStructure
  ): Promise<ValidationResult> {
    this.logger.debug('Validating document structure', {
      chapters: structure.chapters.length,
      paragraphs: structure.totalParagraphs,
    });

    const validationResults = this.performValidation(structure);
    const score = calculateValidationScore(
      structure,
      validationResults.errors.length,
      validationResults.warnings.length
    );

    this.logger.info('Document validation completed', {
      isValid: validationResults.errors.length === 0,
      errors: validationResults.errors.length,
      warnings: validationResults.warnings.length,
      score,
    });

    return {
      isValid: validationResults.errors.length === 0,
      errors: validationResults.errors,
      warnings: validationResults.warnings,
      score,
    };
  }

  /**
   * Create streaming parser for large documents
   *
   * @param input - Markdown content as string or Buffer
   * @returns DocumentStream for chunked processing
   */
  public createStream(input: string | Buffer): DocumentStream {
    if (!this.config.enableStreaming) {
      throw MarkdownParseError.parseFailed(
        PARSER_CONSTANTS.STREAMING_DISABLED_ERROR
      );
    }

    return createStream(input, this);
  }

  /**
   * Get parser configuration
   *
   * @returns Current parser configuration
   */
  public getConfig(): MarkdownParserConfig {
    return this.config;
  }

  /**
   * Extract basic metadata for streaming (delegates to utility)
   *
   * @param content - Content to analyze
   * @returns Basic metadata
   */
  public extractBasicMetadata(content: string): DocumentMetadata {
    return extractBasicMetadata(content);
  }

  /**
   * Tokenize Markdown content using marked
   *
   * @param content - Markdown content
   * @returns Token array or MarkdownParseError
   */
  public tokenizeMarkdown(content: string): ParsedToken[] | MarkdownParseError {
    return tokenizeMarkdown(content);
  }

  /**
   * Extract chapters from tokens
   *
   * @param tokens - Parsed tokens
   * @returns Array of chapters
   */
  public async extractChaptersFromTokens(
    tokens: ParsedToken[]
  ): Promise<Chapter[]> {
    return extractChaptersFromTokens(
      tokens,
      this.config,
      this.isChapterHeader.bind(this)
    );
  }

  /**
   * Validate and prepare input content
   *
   * @param input - Raw input content
   * @returns Validated string content or MarkdownParseError
   */
  private validateAndPrepareInput(
    input: string | Buffer
  ): string | MarkdownParseError {
    return validateAndPrepareInput(input, this.config);
  }

  /**
   * Log parsing start information
   *
   * @param input - Input content
   */
  private logParsingStart(input: string | Buffer): void {
    this.logger.info('Starting Markdown parsing', {
      inputType: typeof input,
      inputSize: typeof input === 'string' ? input.length : input.byteLength,
    });
  }

  /**
   * Log parsing success
   *
   * @param documentStructure - Parsed document structure
   */
  private logParsingSuccess(documentStructure: DocumentStructure): void {
    this.logger.info('Markdown parsing completed successfully', {
      chapters: documentStructure.chapters.length,
      paragraphs: documentStructure.totalParagraphs,
      sentences: documentStructure.totalSentences,
      confidence: documentStructure.confidence,
      duration: documentStructure.processingMetrics.parseDurationMs,
    });
  }

  /**
   * Handle parsing errors
   *
   * @param error - Error that occurred
   * @param startTime - Parse start time
   * @returns Result with error
   */
  private handleParsingError(
    error: unknown,
    startTime: Date
  ): Result<DocumentStructure, MarkdownParseError> {
    return handleParsingError(error, startTime, this.logger);
  }

  /**
   * Perform comprehensive validation
   *
   * @param structure - Document structure to validate
   * @returns Validation errors and warnings
   */
  private performValidation(structure: DocumentStructure): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    return validateChapters(structure, this.config);
  }

  /**
   * Check if token is a chapter header
   *
   * @param token - Token to check
   * @returns True if token is a chapter header
   */
  private isChapterHeader(token: ParsedToken): boolean {
    return (
      token.type === 'heading' &&
      this.config.chapterHeaderLevels.includes(token.depth || 1)
    );
  }
}
