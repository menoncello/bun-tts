import type { ConfigManager } from '../../config/config-manager';
import { UnsupportedFormatError, type Result } from '../../errors/index';
import type { Logger } from '../../interfaces/logger';
import { generateConfidenceReport } from './confidence-scoring';
import { EPUBParser } from './parsers/epub-parser';
import { MarkdownParser } from './parsers/markdown-parser';
import { PDFParser } from './parsers/pdf-parser';
import { StructureAnalyzerDataExtractors } from './structure-analyzer.data-extractors';
import { StructureAnalyzerErrorHandler } from './structure-analyzer.error-handler';
import { StructureAnalyzerParserUtils } from './structure-analyzer.parser-utils';
import { generateDocumentTree } from './structure-analyzer.utils';
import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
  DocumentMetadata,
} from './types';
import type {
  StructureAnalysisOptions,
  StructureAnalysisResult,
  ConfidenceReport,
  DocumentTreeNode,
} from './types/structure-analyzer-types';
import type {
  ValidationError,
  ValidationWarning,
} from './types/validation-types';
import {
  VALIDATION_THRESHOLDS,
  type StructureValidationResult,
} from './validation-constants';
import {
  validateBasicStructure,
  validateChapters,
  calculateOverallScore,
  generateRecommendations,
  needsManualReview,
} from './validation-helpers';

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_MEGABYTE;

export type DocumentFormat = 'markdown' | 'pdf' | 'epub';

export interface AnalyzerConfig {
  defaultConfidenceThreshold: number;
  enableStreaming: boolean;
  maxFileSize: number;
  validateStructure: boolean;
  detailedConfidenceReporting: boolean;
}

/** Core analyzer implementation */
export class StructureAnalyzerCore {
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private config: AnalyzerConfig;
  private readonly markdownParser: MarkdownParser;
  private readonly pdfParser: PDFParser;
  private readonly epubParser: EPUBParser;

  /**
   * Creates a new StructureAnalyzerCore instance.
   * @param {Logger} logger - The logger instance for recording operations and errors
   * @param {ConfigManager} configManager - The configuration manager for accessing settings
   * @param {Partial<AnalyzerConfig>} configOverrides - Optional configuration overrides to customize analyzer behavior
   */
  constructor(
    logger: Logger,
    configManager: ConfigManager,
    configOverrides?: Partial<AnalyzerConfig>
  ) {
    this.logger = logger;
    this.configManager = configManager;
    this.config = {
      defaultConfidenceThreshold: 0.7,
      enableStreaming: true,
      maxFileSize: MAX_FILE_SIZE_BYTES,
      validateStructure: true,
      detailedConfidenceReporting: true,
      ...configOverrides,
    };

    this.logger.debug('Initializing StructureAnalyzerCore', {
      enableStreaming: this.config.enableStreaming,
      maxFileSize: this.config.maxFileSize,
      validateStructure: this.config.validateStructure,
      detailedConfidenceReporting: this.config.detailedConfidenceReporting,
    });

    this.markdownParser = new MarkdownParser(logger, configManager);
    this.pdfParser = new PDFParser(logger, configManager);
    this.epubParser = new EPUBParser({});

    this.logger.debug('StructureAnalyzerCore initialized with all parsers', {
      parsers: ['markdown', 'pdf', 'epub'],
    });
  }

  /**
   * Analyzes document structure and generates comprehensive report.
   * @param {string} input - The document content to analyze
   * @param {DocumentFormat} format - The document format (markdown, pdf, or epub)
   * @param {StructureAnalysisOptions} _options - Optional analysis configuration settings
   * @returns {Promise<StructureAnalysisResult>} A comprehensive structure analysis result with confidence metrics
   */
  async analyzeStructure(
    input: string,
    format: DocumentFormat,
    _options?: StructureAnalysisOptions
  ): Promise<StructureAnalysisResult> {
    const startTime = Date.now();
    this.logAnalysisStart(format, input.length);

    const parseResult = await this.parseDocument(input, format);
    if (!parseResult.success) {
      return this.buildErrorResult(format, startTime, parseResult.error);
    }

    return this.processSuccessfulAnalysis(parseResult.data, format, startTime);
  }

  /**
   * Logs the start of structure analysis.
   * @param {DocumentFormat} format - The document format being analyzed
   * @param {number} inputLength - The length of the input content
   */
  private logAnalysisStart(format: DocumentFormat, inputLength: number): void {
    this.logger.debug('Starting structure analysis', {
      format,
      inputLength,
    });
  }

  /**
   * Processes a successful document parsing and builds analysis results.
   * @param {DocumentStructure} documentStructure - The successfully parsed document structure
   * @param {DocumentFormat} format - The document format that was analyzed
   * @param {number} startTime - The timestamp when analysis started
   * @returns {StructureAnalysisResult} The complete analysis result
   */
  private processSuccessfulAnalysis(
    documentStructure: DocumentStructure,
    format: DocumentFormat,
    startTime: number
  ): StructureAnalysisResult {
    const confidenceReport = generateConfidenceReport(
      documentStructure,
      this.config.detailedConfidenceReporting
    );
    const documentTree = generateDocumentTree(documentStructure);
    const validation = { isValid: true, errors: [], warnings: [] };

    return this.buildSuccessResult(format, startTime, {
      confidenceReport: confidenceReport,
      documentStructure: documentStructure,
      documentTree: documentTree,
      validation: validation,
    });
  }

  /**
   * Parses document based on format.
   * @param {string} input - The document content to parse
   * @param {DocumentFormat} format - The document format type
   * @returns {Promise<Result<DocumentStructure, any>>} A result object containing the parsed document structure or an error
   */
  private async parseDocument(
    input: string,
    format: DocumentFormat
  ): Promise<Result<DocumentStructure, Error>> {
    this.logger.debug('Parsing document', { format });

    if (format === 'markdown') {
      return this.markdownParser.parse(input);
    }

    if (format === 'pdf') {
      return this.pdfParser.parse(input);
    }

    if (format === 'epub') {
      const epubResult = await this.epubParser.parse(input);
      return StructureAnalyzerParserUtils.convertParseResultToResult(
        epubResult
      );
    }

    return {
      success: false,
      error: new UnsupportedFormatError(format),
    };
  }

  /**
   * Builds a successful analysis result.
   * @param {DocumentFormat} format - The document format that was analyzed
   * @param {number} startTime - The timestamp when analysis started (for performance metrics)
   * @param {AnalysisData} data - The analysis data containing all required components
   * @param {ConfidenceReport} data.confidenceReport - The confidence report for the analysis
   * @param {DocumentStructure} data.documentStructure - The parsed document structure
   * @param {DocumentTreeNode} data.documentTree - The hierarchical document tree representation
   * @param {unknown} data.validation - The validation results for the document structure
   * @returns {StructureAnalysisResult} A successful structure analysis result
   */
  private buildSuccessResult(
    format: DocumentFormat,
    startTime: number,
    data: {
      confidenceReport: ConfidenceReport;
      documentStructure: DocumentStructure;
      documentTree: DocumentTreeNode;
      validation: unknown;
    }
  ): StructureAnalysisResult {
    return {
      format,
      documentStructure: data.documentStructure,
      confidence: data.confidenceReport,
      structureTree: data.documentTree,
      validation: data.validation as StructureValidationResult | null,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Builds an error result when analysis fails.
   * @param {DocumentFormat} format - The document format that was being analyzed
   * @param {number} startTime - The timestamp when analysis started (for performance metrics)
   * @param {Error} error - The error that occurred during analysis
   * @returns {StructureAnalysisResult} A structure analysis result containing error information
   */
  private buildErrorResult(
    format: DocumentFormat,
    startTime: number,
    error: unknown
  ): StructureAnalysisResult {
    const errorMessage =
      StructureAnalyzerErrorHandler.extractErrorMessage(error);
    this.logger.error('Analysis failed', { format, error: errorMessage });

    return StructureAnalyzerErrorHandler.buildErrorResult(
      format,
      startTime,
      error instanceof Error ? error : new Error(errorMessage),
      errorMessage
    );
  }

  /**
   * Validates and corrects document structure.
   * @param {DocumentStructure} structure - The document structure to validate and correct
   * @param {unknown} _options - Optional validation configuration settings
   * @returns {Promise<StructureValidationResult>} A promise that resolves with validation results
   */
  async validateAndCorrectStructure(
    structure: DocumentStructure,
    _options?: unknown
  ): Promise<StructureValidationResult> {
    this.logger.debug('Validating structure', {
      chapterCount: structure.chapters.length,
    });

    return this.performValidation(structure);
  }

  /**
   * Performs the actual validation of the document structure.
   * @param {DocumentStructure} structure - The document structure to validate
   * @returns {StructureValidationResult} The validation results
   */
  private performValidation(
    structure: DocumentStructure
  ): StructureValidationResult {
    const errors = validateBasicStructure(structure);
    const warnings = validateChapters(structure.chapters);
    const validationResult = this.calculateValidationMetrics(
      errors,
      warnings,
      structure
    );

    return {
      ...validationResult,
      errors,
      warnings,
      corrections: [],
      canAutoCorrect: false,
    };
  }

  /**
   * Calculates validation metrics and determines validation status.
   * @param {ValidationError[]} errors - The validation errors found
   * @param {ValidationWarning[]} warnings - The validation warnings found
   * @param {DocumentStructure} structure - The document structure being validated
   * @returns {Omit<StructureValidationResult, 'errors' | 'warnings' | 'corrections' | 'canAutoCorrect'>} Validation metrics
   */
  private calculateValidationMetrics(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    structure: DocumentStructure
  ): Omit<
    StructureValidationResult,
    'errors' | 'warnings' | 'corrections' | 'canAutoCorrect'
  > {
    const errorCount = errors.length;
    const warningCount = warnings.length;
    const overallScore = calculateOverallScore(errorCount, warningCount);
    const recommendations = generateRecommendations(
      errorCount,
      warningCount,
      structure
    );

    return {
      isValid: errorCount === 0,
      overallScore,
      meetsConfidenceThreshold:
        structure.confidence >= VALIDATION_THRESHOLDS.LOW_CONFIDENCE_THRESHOLD,
      hasTooManyWarnings:
        warningCount > VALIDATION_THRESHOLDS.DEFAULT_MAX_WARNINGS,
      needsManualReview: needsManualReview(overallScore, warningCount),
      recommendations,
    };
  }

  /**
   * Extracts chapters from document structure.
   * @param {DocumentStructure} structure - The document structure containing chapters
   * @returns {Chapter[]} An array of chapters extracted from the document structure
   */
  extractChapters(structure: DocumentStructure): Chapter[] {
    return StructureAnalyzerDataExtractors.extractChapters(structure);
  }

  /**
   * Extracts sections from a chapter.
   * @param {Chapter} chapter - The chapter containing paragraphs
   * @returns {Paragraph[]} An array of paragraphs representing sections from the chapter
   */
  extractSections(chapter: Chapter): Paragraph[] {
    return StructureAnalyzerDataExtractors.extractSections(chapter);
  }

  /**
   * Extracts all paragraphs from document structure.
   * @param {DocumentStructure} structure - The document structure containing chapters and paragraphs
   * @returns {Paragraph[]} A flattened array of all paragraphs from all chapters
   */
  extractParagraphs(structure: DocumentStructure): Paragraph[] {
    return StructureAnalyzerDataExtractors.extractParagraphs(structure);
  }

  /**
   * Extracts sentences from a paragraph.
   * @param {Paragraph} paragraph - The paragraph containing sentences
   * @returns {Sentence[]} An array of sentences extracted from the paragraph
   */
  extractSentences(paragraph: Paragraph): Sentence[] {
    return StructureAnalyzerDataExtractors.extractSentences(paragraph);
  }

  /**
   * Gets document metadata from structure.
   * @param {DocumentStructure} structure - The document structure containing metadata
   * @returns {DocumentMetadata} Document metadata including word counts, sentence counts, and structure metrics
   */
  getDocumentMetadata(structure: DocumentStructure): DocumentMetadata {
    return StructureAnalyzerDataExtractors.getDocumentMetadata(structure);
  }

  /**
   * Checks if document meets quality thresholds.
   * @param {DocumentStructure} structure - The document structure to evaluate
   * @param {number} threshold - Optional custom confidence threshold (uses default if not provided)
   * @returns {boolean} True if the document meets or exceeds the quality threshold
   */
  meetsQualityThresholds(
    structure: DocumentStructure,
    threshold?: number
  ): boolean {
    return StructureAnalyzerDataExtractors.meetsQualityThresholds(
      structure,
      threshold,
      this.config.defaultConfidenceThreshold
    );
  }

  /**
   * Gets current analyzer configuration.
   * @returns {AnalyzerConfig} A copy of the current analyzer configuration
   */
  getConfig(): AnalyzerConfig {
    return { ...this.config };
  }

  /**
   * Updates analyzer configuration with new values.
   * @param {Partial<AnalyzerConfig>} updates - Partial configuration updates to merge with existing config
   */
  updateConfig(updates: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
