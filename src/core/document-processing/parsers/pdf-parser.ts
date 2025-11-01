/**
 * PDF parser implementation for bun-tts.
 * Provides PDF document parsing capabilities with structure extraction.
 */

import type { ConfigManager } from '../../../config/config-manager';
import {
  PdfParseError,
  PDF_PARSE_ERROR_CODES,
} from '../../../errors/pdf-parse-error';
import type { Result } from '../../../errors/result';
import type { Logger } from '../../../interfaces/logger';
import type { DocumentStructure, PDFStructure } from '../types';
import { convertPDFStructureToDocumentStructure } from './pdf-parser-conversion';
import {
  handleParsingError,
  logParsingSuccess,
} from './pdf-parser-error-handlers';
import { createMockPDFMetadata, getMockPDFText } from './pdf-parser-metadata';
import { extractStructureFromText } from './pdf-parser-structure-extractor';
import { extractTablesFromText } from './pdf-parser-table-extractor';
import {
  validatePDFFilePath,
  validatePDFFile,
  isOversizedFile,
} from './pdf-parser-validation';

// Constants for PDF parsing configuration
const DEFAULT_MAX_FILE_SIZE_MB = 50;
const BYTES_PER_MB = 1024;
const DEFAULT_MAX_FILE_SIZE = DEFAULT_MAX_FILE_SIZE_MB * BYTES_PER_MB; // 50MB
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Configuration for PDF parsing.
 */
export interface PDFParserConfig {
  /** Maximum file size to process */
  maxFileSize: number;
  /** Confidence threshold for structure detection */
  confidenceThreshold: number;
  /** Whether to extract images */
  extractImages: boolean;
  /** Whether to extract tables */
  extractTables: boolean;
}

/**
 * PDF parser class for converting PDF documents to structured document format.
 */
export class PDFParser {
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private readonly config: PDFParserConfig;

  /**
   * Create a new PDFParser instance.
   *
   * @param {Logger} logger - Logger instance for debugging and error reporting
   * @param {ConfigManager} configManager - Configuration manager for accessing application settings
   * @param {PDFParserConfig} config - Optional PDF parser configuration overrides
   */
  constructor(
    logger: Logger,
    configManager: ConfigManager,
    config?: Partial<PDFParserConfig>
  ) {
    this.logger = logger;
    this.configManager = configManager;
    this.config = {
      maxFileSize: config?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
      confidenceThreshold:
        config?.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      extractImages: config?.extractImages ?? true,
      extractTables: config?.extractTables ?? true,
      ...config,
    };
  }

  /**
   * Parse a PDF document and return structured document representation.
   *
   * @param {string} filePath - Path to the PDF file to parse
   * @returns {Promise<Result<DocumentStructure, PdfParseError>>} Result containing DocumentStructure or error
   */
  async parse(
    filePath: string
  ): Promise<Result<DocumentStructure, PdfParseError>> {
    // Validate input
    const inputValidation = this.validateInput(filePath);
    if (!inputValidation.success) {
      return inputValidation;
    }

    this.logger.info('Starting PDF parsing', { filePath });

    // Check file size
    const sizeValidation = this.validateFileSize(filePath);
    if (!sizeValidation.success) {
      return sizeValidation;
    }

    return this.executeParsing(filePath);
  }

  /**
   * Validates the input file path.
   *
   * @param {string} filePath - Path to the PDF file to validate
   * @returns {Result<void, PdfParseError>} Validation result
   */
  private validateInput(filePath: string): Result<void, PdfParseError> {
    const pathValidation = validatePDFFilePath(filePath);
    if (!pathValidation.success) {
      return {
        success: false,
        error: pathValidation.error,
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Validates the file size.
   *
   * @param {string} filePath - Path to the PDF file to validate
   * @returns {Result<void, PdfParseError>} Size validation result
   */
  private validateFileSize(filePath: string): Result<void, PdfParseError> {
    if (isOversizedFile(filePath)) {
      return {
        success: false,
        error: new PdfParseError(
          PDF_PARSE_ERROR_CODES.FILE_TOO_LARGE,
          'File size exceeds maximum limit',
          {}
        ),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Executes the parsing process with error handling.
   *
   * @param {string} filePath - Path to the PDF file to parse
   * @returns {Promise<Result<DocumentStructure, PdfParseError>>} Parsing result
   */
  private async executeParsing(
    filePath: string
  ): Promise<Result<DocumentStructure, PdfParseError>> {
    try {
      const documentStructure = await this.performParsing(filePath);
      logParsingSuccess(this.logger, filePath, documentStructure);

      return {
        success: true,
        data: documentStructure,
      };
    } catch (error) {
      return handleParsingError(error, filePath);
    }
  }

  /**
   * Performs the actual parsing logic.
   *
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<DocumentStructure>} Parsed document structure
   */
  private async performParsing(filePath: string): Promise<DocumentStructure> {
    const mockPDFText = getMockPDFText();
    const pdfMetadata = createMockPDFMetadata(filePath, mockPDFText);
    const pdfStructure = extractStructureFromText(mockPDFText, pdfMetadata);

    // Extract tables if enabled in configuration
    if (this.config.extractTables) {
      this.processTables(mockPDFText, pdfStructure);
    }

    return convertPDFStructureToDocumentStructure(
      pdfStructure as PDFStructure,
      pdfMetadata,
      filePath
    );
  }

  /**
   * Processes tables from PDF text and updates the PDF structure.
   *
   * @param {string} mockPDFText - Mock PDF text content
   * @param {unknown} pdfStructure - PDF structure to update with table data
   */
  private processTables(mockPDFText: string, pdfStructure: unknown): void {
    this.logger.info('Extracting tables from PDF text', {
      extractTables: this.config.extractTables,
    });

    const tables = extractTablesFromText(mockPDFText, 1);
    this.logger.info('Table extraction completed', {
      tableCount: tables.length,
    });

    if (tables.length > 0) {
      const simplifiedTables = tables.map((table) => ({
        id: table.id,
        pageNumber: table.pageNumber,
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        confidence: table.confidence,
        formatType: table.formatType,
      }));
      (pdfStructure as { tables?: typeof simplifiedTables }).tables =
        simplifiedTables;
    }
  }

  /**
   * Validate a PDF file before parsing.
   *
   * @param {string} filePath - Path to the PDF file to validate
   * @returns {Promise<Result<boolean, PdfParseError>>} Result indicating validation success or failure
   */
  async validate(filePath: string): Promise<Result<boolean, PdfParseError>> {
    this.logger.info('Validating PDF file', { filePath });

    try {
      const validationResult = await validatePDFFile(
        filePath,
        this.config.maxFileSize
      );

      if (validationResult.success) {
        this.logger.info('PDF file validation successful', {
          filePath,
        });
      }

      return validationResult;
    } catch (error) {
      return this.handleValidationError(error, filePath);
    }
  }

  /**
   * Handles validation errors and returns appropriate error result.
   *
   * @param {unknown} error - The error that occurred during validation
   * @param {string} filePath - File path being validated
   * @returns {Result<boolean, PdfParseError>} Error result
   */
  private handleValidationError(
    error: unknown,
    filePath: string
  ): Result<boolean, PdfParseError> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    this.logger.error('PDF file validation failed', {
      filePath,
      error: errorMessage,
    });

    const pdfError = new PdfParseError(
      PDF_PARSE_ERROR_CODES.IO_ERROR,
      `Failed to validate PDF: ${errorMessage}`,
      { cause: new Error(errorMessage) }
    );

    return {
      success: false,
      error: pdfError,
    };
  }
}
