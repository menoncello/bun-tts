/**
 * EPUB Document Parser
 * Handles parsing of EPUB files with streaming support for large documents.
 * Uses @smoores/epub library for zipped HTML/XML structure extraction.
 */

import { logger } from '../../../utils/logger';
import type { DocumentParser, ParseResult, PerformanceStats } from '../types';
import { normalizeError } from './epub-parser-error-handling';
import {
  initializeOptions,
  initializePerformanceStats,
} from './epub-parser-initialization';
import { validateInput, createEPUBInstance } from './epub-parser-input-handler';
import { extractAllComponents } from './epub-parser-process-extractor';
import { buildCompleteStructure } from './epub-parser-structure-builder';
import type { EPUBParseOptions } from './epub-parser-types';
import { validateEPUBStructure } from './epub-parser-validation';

export type { EPUBParseOptions } from './epub-parser-types';

type EpubInput = string | Buffer | ArrayBuffer;
/**
 * EPUB Document Parser class for parsing EPUB files into structured document data
 */
export class EPUBParser implements DocumentParser {
  private readonly name = 'EPUBParser';
  private readonly version = '1.0.0';

  private options: EPUBParseOptions;
  private performanceStats: PerformanceStats;
  private startTime = 0;

  /**
   * Creates a new EPUBParser instance
   * @param options - Configuration options for EPUB parsing
   */
  constructor(options: EPUBParseOptions = {}) {
    this.options = initializeOptions(options);
    this.performanceStats = initializePerformanceStats();
  }

  /**
   * Parses an EPUB file and extracts its structure
   * @param input - The EPUB file data (path, buffer, or array buffer)
   * @param options - Optional parsing configuration to override defaults
   * @returns Promise resolving to parse result with document data or error
   */
  async parse(
    input: EpubInput,
    options?: EPUBParseOptions
  ): Promise<ParseResult> {
    this.startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };

    try {
      logger.debug('Starting EPUB parsing', { parser: this.name });
      validateInput(input);
      const epub = await createEPUBInstance(input);
      await validateEPUBStructure(epub);

      const parseResults = await extractAllComponents(
        epub,
        mergedOptions,
        (documentData, opts) =>
          buildCompleteStructure(
            documentData,
            opts,
            this.startTime,
            this.performanceStats
          )
      );

      await epub.close();
      return { success: true, data: parseResults.documentStructure };
    } catch (error) {
      return { success: false, error: normalizeError(error) };
    }
  }

  /**
   * Updates parser options
   * @param options - Partial options to merge with existing configuration
   */
  setOptions(options: Partial<EPUBParseOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets current performance statistics
   * @returns Copy of current performance statistics
   */
  getStats(): PerformanceStats {
    return { ...this.performanceStats };
  }
}
