/**
 * EPUB Document Parser
 * Handles parsing of EPUB files with streaming support for large documents.
 * Uses @smoores/epub library for zipped HTML/XML structure extraction.
 */

import { Epub } from '@smoores/epub';
import { DocumentParseError } from '../../../errors/document-parse-error.js';
import { logger } from '../../../utils/logger.js';
import type {
  DocumentParser,
  DocumentStructure,
  ParseResult,
  PerformanceStats,
} from '../types.js';
import {
  hasValidStructure,
  hasValidChapters,
  hasValidTitle,
  isInvalidBufferContent,
  isInvalidStringContent,
  isInvalidTextBuffer,
  isInvalidTextString,
} from './epub-parser-content-helpers.js';
import { normalizeError } from './epub-parser-error-handling.js';
import {
  initializeOptions,
  initializePerformanceStats,
} from './epub-parser-initialization.js';
import {
  validateInput,
  createEPUBInstance,
  isValidEpubInput,
  isValidEpubOptions,
} from './epub-parser-input-handler.js';
import { extractAllComponents } from './epub-parser-process-extractor.js';
import { buildCompleteStructure } from './epub-parser-structure-builder.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import { validateEPUBStructure } from './epub-parser-validation.js';

export type { EPUBParseOptions } from './epub-parser-types.js';

type EpubInput = string | Buffer | ArrayBuffer;

// Constants for parsing thresholds
const MAX_CRITICAL_ERRORS_THRESHOLD = 5;

// Error message constants
const INVALID_EPUB_CONTENT_PREFIX = 'Invalid EPUB content:';
const INPUT_REQUIRED_MESSAGE = 'Input is required';

// Type for parse results from extractAllComponents
interface ParseResults {
  documentStructure: DocumentStructure;
  chapters: unknown[];
  stats: unknown;
}
/**
 * EPUB Document Parser class for parsing EPUB files into structured document data
 */
export class EPUBParser implements DocumentParser {
  public readonly name = 'EPUBParser';
  public readonly version = '1.0.0';

  private options: EPUBParseOptions;
  private performanceStats: PerformanceStats;
  private startTime = 0;

  /**
   * Creates a new EPUBParser instance
   * @param {EPUBParseOptions} options - Configuration options for EPUB parsing
   */
  constructor(options: EPUBParseOptions = {}) {
    this.options = initializeOptions(options);
    this.performanceStats = initializePerformanceStats();
  }

  /**
   * Validate undefined input
   * @param {unknown} input - The input to validate
   * @returns {ParseResult | null} Error result if invalid, null if valid
   */
  private validateUndefinedInput(input: unknown): ParseResult | null {
    if (input === undefined) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: INPUT_REQUIRED_MESSAGE,
          details: { receivedType: 'undefined' },
        },
      };
    }
    return null;
  }

  /**
   * Validate input type
   * @param {unknown} input - The input to validate
   * @returns {ParseResult | null} Error result if invalid, null if valid
   */
  private validateInputType(input: unknown): ParseResult | null {
    if (!isValidEpubInput(input)) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT_TYPE',
          message:
            'Invalid input type for EPUB parsing. Expected string, Buffer, or ArrayBuffer.',
          details: { receivedType: typeof input },
        },
      };
    }
    return null;
  }

  /**
   * Validate options type
   * @param {unknown} options - The options to validate
   * @returns {ParseResult | null} Error result if invalid, null if valid
   */
  private validateOptionsType(options: unknown): ParseResult | null {
    if (options !== undefined && !isValidEpubOptions(options)) {
      return {
        success: false,
        error: {
          code: 'INVALID_OPTIONS_TYPE',
          message: 'Invalid options type. Expected object or undefined.',
          details: { receivedType: typeof options },
        },
      };
    }
    return null;
  }

  /**
   * Validate empty string input
   * @param {unknown} input - The input to validate
   * @returns {ParseResult | null} Error result if empty string, null if valid
   */
  private validateEmptyString(input: unknown): ParseResult | null {
    if (typeof input === 'string' && input.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: INPUT_REQUIRED_MESSAGE,
          details: { receivedType: 'empty_string' },
        },
      };
    }
    return null;
  }

  /**
   * Validate and normalize parse inputs
   * @param {unknown} input - The input to validate
   * @param {unknown} options - The options to validate
   * @returns {{epubInput: EpubInput, epubOptions: EPUBParseOptions | undefined} | ParseResult} Validated inputs or error result
   */
  private validateParseInputs(
    input: unknown,
    options: unknown
  ):
    | { epubInput: EpubInput; epubOptions: EPUBParseOptions | undefined }
    | ParseResult {
    const typeError = this.validateInputType(input);
    if (typeError) return typeError;

    const undefinedError = this.validateUndefinedInput(input);
    if (undefinedError) return undefinedError;

    const emptyStringError = this.validateEmptyString(input);
    if (emptyStringError) return emptyStringError;

    const optionsError = this.validateOptionsType(options);
    if (optionsError) return optionsError;

    // Now we can safely use the types
    return {
      epubInput: input as EpubInput,
      epubOptions: options as EPUBParseOptions | undefined,
    } as { epubInput: EpubInput; epubOptions: EPUBParseOptions | undefined };
  }

  /**
   * Check if parsing results contain valid content
   * @param {DocumentStructure} documentStructure - The document structure to validate
   * @returns {boolean} True if content is valid
   */
  private hasValidContent(documentStructure: DocumentStructure): boolean {
    if (!hasValidStructure(documentStructure)) {
      return false;
    }

    const hasChaptersValid = hasValidChapters(documentStructure);
    const hasValidTitleDoc = hasValidTitle(documentStructure);

    // For content to be considered valid, it needs meaningful chapters OR a valid title
    return hasChaptersValid || hasValidTitleDoc;
  }

  /**
   * Create error result for failed parsing
   * @param {DocumentStructure} documentStructure - The document structure to include in error details
   * @returns {ParseResult} Error result
   */
  private createParsingErrorResult(
    documentStructure: DocumentStructure
  ): ParseResult {
    return {
      success: false,
      error: {
        code: 'EPUB_FORMAT_ERROR',
        message: 'EPUB parsing failed: No valid content could be extracted',
        details: {
          chaptersFound: documentStructure.chapters.length,
          wordCount: documentStructure.totalWordCount,
          title: documentStructure.metadata.title,
        },
      },
    };
  }

  /**
   * Execute the main parsing logic
   * @param {EpubInput} epubInput - Validated EPUB input
   * @param {EPUBParseOptions} mergedOptions - Merged parsing options
   * @returns {Promise<{epub: Epub, parseResults: ParseResults, criticalErrors: number}>} Parsing results
   */
  private async executeParsing(
    epubInput: EpubInput,
    mergedOptions: EPUBParseOptions
  ): Promise<{
    epub: Epub;
    parseResults: ParseResults;
    criticalErrors: number;
  }> {
    let criticalErrors = 0;

    logger.debug('Starting EPUB parsing', { parser: this.name });

    this.performContentValidation(epubInput);
    const epub = await this.createAndValidateEpub(epubInput);
    const parseResults = await this.extractComponentsWithValidation(
      epub,
      mergedOptions,
      () => criticalErrors++
    );

    return { epub, parseResults, criticalErrors };
  }

  /**
   * Perform content validation on EPUB input
   * @param {EpubInput} epubInput - The EPUB input to validate
   */
  private performContentValidation(epubInput: EpubInput): void {
    if (this.isObviouslyInvalidContent(epubInput)) {
      throw new Error(
        `${INVALID_EPUB_CONTENT_PREFIX} Not a valid EPUB file format`
      );
    }

    if (this.isObviouslyNonEpubTextContent(epubInput)) {
      throw new Error(
        `${INVALID_EPUB_CONTENT_PREFIX} Text content is not a valid EPUB format`
      );
    }

    if (typeof epubInput === 'string' && epubInput.trim().length === 0) {
      throw new DocumentParseError(INPUT_REQUIRED_MESSAGE, 'INVALID_INPUT');
    }
  }

  /**
   * Create and validate EPUB instance
   * @param {EpubInput} epubInput - The EPUB input
   * @returns {Promise<Epub>} Validated EPUB instance
   */
  private async createAndValidateEpub(epubInput: EpubInput): Promise<Epub> {
    validateInput(epubInput);
    const epub = await createEPUBInstance(epubInput);
    await validateEPUBStructure(epub);
    return epub;
  }

  /**
   * Extract components with validation callback
   * @param {Epub} epub - The EPUB instance
   * @param {EPUBParseOptions} mergedOptions - Merged parsing options
   * @param {() => void} incrementCriticalErrors - Function to increment critical errors
   * @returns {Promise<ParseResults>} Parse results
   */
  private async extractComponentsWithValidation(
    epub: Epub,
    mergedOptions: EPUBParseOptions,
    incrementCriticalErrors: () => void
  ): Promise<ParseResults> {
    return extractAllComponents(epub, mergedOptions, (documentData, opts) => {
      if (documentData.chapters.length === 0 && opts.strictMode !== false) {
        incrementCriticalErrors();
      }

      return buildCompleteStructure(
        documentData,
        opts,
        this.startTime,
        this.performanceStats
      );
    });
  }

  /**
   * Check if input is obviously invalid EPUB content
   * @param {EpubInput} epubInput - The EPUB input to check
   * @returns {boolean} True if content is obviously invalid
   */
  private isObviouslyInvalidContent(epubInput: EpubInput): boolean {
    if (Buffer.isBuffer(epubInput)) {
      return isInvalidBufferContent(epubInput);
    }

    if (typeof epubInput === 'string') {
      return isInvalidStringContent(epubInput);
    }

    return false;
  }

  /**
   * Cleanup EPUB instance
   * @param {Epub | null} epub - EPUB instance to cleanup
   */
  private async cleanupEpubInstance(epub: Epub | null): Promise<void> {
    if (epub) {
      try {
        await epub.close();
      } catch (cleanupError) {
        // Log cleanup error but don't let it mask the original error
        logger.warn('Failed to close EPUB instance during cleanup', {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : 'Unknown cleanup error',
        });
      }
    }
  }

  /**
   * Parses an EPUB file and extracts its structure
   * @param {EpubInput} input - The EPUB file data (path, buffer, or array buffer)
   * @param {EPUBParseOptions} [options] - Optional parsing configuration to override defaults
   * @returns {Promise<ParseResult>} Promise resolving to parse result with document data or error
   */
  async parse(input: unknown, options?: unknown): Promise<ParseResult> {
    const validatedInputs = this.validateParseInputs(input, options);
    if (!('epubInput' in validatedInputs)) {
      return validatedInputs as ParseResult;
    }

    const { epubInput, epubOptions } = validatedInputs;
    this.startTime = Date.now();
    const mergedOptions = { ...this.options, ...epubOptions };

    return this.executeParsingWithCleanup(epubInput, mergedOptions);
  }

  /**
   * Execute parsing with cleanup and error handling
   * @param {EpubInput} epubInput - The validated EPUB input
   * @param {EPUBParseOptions} mergedOptions - Merged parsing options
   * @returns {Promise<ParseResult>} Parse result
   */
  private async executeParsingWithCleanup(
    epubInput: EpubInput,
    mergedOptions: EPUBParseOptions
  ): Promise<ParseResult> {
    let epub: Epub | null = null;

    try {
      const {
        epub: epubInstance,
        parseResults,
        criticalErrors,
      } = await this.executeParsing(epubInput, mergedOptions);
      epub = epubInstance;

      return this.validateParsingResults(
        parseResults,
        criticalErrors,
        mergedOptions
      );
    } catch (error) {
      return this.handleParsingError(error);
    } finally {
      await this.cleanupEpubInstance(epub);
    }
  }

  /**
   * Validate parsing results and return appropriate result
   * @param {ParseResults} parseResults - The parsing results
   * @param {number} criticalErrors - Number of critical errors
   * @param {EPUBParseOptions} mergedOptions - Merged parsing options
   * @returns {ParseResult} Validation result
   */
  private validateParsingResults(
    parseResults: ParseResults,
    criticalErrors: number,
    mergedOptions: EPUBParseOptions
  ): ParseResult {
    const hasValidContent = this.hasValidContent(
      parseResults.documentStructure
    );
    const hasTooManyErrors = criticalErrors >= MAX_CRITICAL_ERRORS_THRESHOLD;

    if (
      (!hasValidContent || hasTooManyErrors) &&
      mergedOptions.strictMode !== false
    ) {
      return this.createParsingErrorResult(parseResults.documentStructure);
    }

    return { success: true, data: parseResults.documentStructure };
  }

  /**
   * Handle parsing errors and update performance stats
   * @param {unknown} error - The error to handle
   * @returns {ParseResult} Error result
   */
  private handleParsingError(error: unknown): ParseResult {
    this.performanceStats.parseTimeMs = Date.now() - this.startTime;
    return { success: false, error: normalizeError(error) };
  }

  /**
   * Updates parser options
   * @param {Partial<EPUBParseOptions>} options - Partial options to merge with existing configuration
   */
  setOptions(options: Partial<EPUBParseOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets current performance statistics
   * @returns {PerformanceStats} Copy of current performance statistics
   */
  getStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * Check if input is obviously non-EPUB text content
   * @param {EpubInput} epubInput - The EPUB input to check
   * @returns {boolean} True if content is obviously non-EPUB text
   */
  private isObviouslyNonEpubTextContent(epubInput: EpubInput): boolean {
    if (Buffer.isBuffer(epubInput)) {
      return isInvalidTextBuffer(epubInput);
    }

    if (typeof epubInput === 'string') {
      return isInvalidTextString(epubInput);
    }

    return false;
  }
}
