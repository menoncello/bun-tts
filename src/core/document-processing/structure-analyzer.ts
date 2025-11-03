import type { ConfigManager } from '../../config/config-manager';
import type { Logger } from '../../interfaces/logger';
import { generateConfidenceReport as generateConfidenceReportInternal } from './confidence-scoring';
import {
  StructureAnalyzerCore,
  type AnalyzerConfig,
  type DocumentFormat,
} from './structure-analyzer.core';
import { generateDocumentTree as generateDocumentTreeInternal } from './structure-analyzer.utils';
import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
  DocumentMetadata,
} from './types';
import type {
  DocumentTreeNode,
  ConfidenceReport,
  StructureAnalysisOptions,
  StructureAnalysisResult,
} from './types/structure-analyzer-types';

export { type DocumentFormat } from './structure-analyzer.core';

/**
 * StructureAnalyzer wrapper class that provides a high-level interface for document structure analysis.
 * This class delegates to the core implementation while maintaining backward compatibility.
 */
export class StructureAnalyzer {
  private readonly core: StructureAnalyzerCore;

  /**
   * Creates a new StructureAnalyzer instance with the specified dependencies.
   *
   * @param {Logger} logger - The logger instance for recording analysis operations and debugging information
   * @param {ConfigManager} configManager - The configuration manager for accessing analyzer settings
   * @param {Partial<AnalyzerConfig>} [configOverrides] - Optional configuration overrides to customize analyzer behavior
   */
  constructor(
    logger: Logger,
    configManager: ConfigManager,
    configOverrides?: Partial<AnalyzerConfig>
  ) {
    this.core = new StructureAnalyzerCore(
      logger,
      configManager,
      configOverrides
    );
  }

  /**
   * Analyzes the structure of a document to extract hierarchical components like chapters, sections, and paragraphs.
   *
   * @param {string} input - The document content to analyze
   * @param {DocumentFormat} format - The format of the input document (e.g., 'epub', 'pdf', 'text')
   * @param {StructureAnalysisOptions} [options] - Optional configuration for customizing the analysis process
   * @returns {Promise<StructureAnalysisResult>} A promise that resolves to the complete structure analysis result
   */
  async analyzeStructure(
    input: string,
    format: DocumentFormat,
    options?: StructureAnalysisOptions
  ): Promise<StructureAnalysisResult> {
    return this.core.analyzeStructure(input, format, options);
  }

  /**
   * Validates the document structure and applies corrections to fix common issues.
   *
   * @param {DocumentStructure} structure - The document structure to validate and potentially correct
   * @param {unknown} [options] - Optional configuration for the validation and correction process
   * @returns {Promise<unknown>} A promise that resolves to the validation and correction result
   */
  validateAndCorrectStructure(
    structure: DocumentStructure,
    options?: unknown
  ): Promise<unknown> {
    return this.core.validateAndCorrectStructure(structure, options);
  }

  /**
   * Generates a confidence report that assesses the quality and reliability of the document structure analysis.
   *
   * @param {DocumentStructure} structure - The document structure to analyze for confidence metrics
   * @returns {ConfidenceReport} A confidence report containing quality scores, metrics, and recommendations
   */
  generateConfidenceReport(structure: DocumentStructure): ConfidenceReport {
    return generateConfidenceReportInternal(
      structure,
      this.core.getConfig().detailedConfidenceReporting
    );
  }

  /**
   * Generates a hierarchical tree representation of the document structure for visualization and navigation.
   *
   * @param {DocumentStructure} structure - The document structure to convert into a tree format
   * @returns {DocumentTreeNode} A tree node structure representing the document hierarchy
   */
  generateStructureTree(structure: DocumentStructure): DocumentTreeNode {
    return generateDocumentTreeInternal(structure);
  }

  /**
   * Extracts chapter information from the document structure.
   *
   * @param {DocumentStructure} structure - The document structure to extract chapters from
   * @returns {Chapter[]} An array of chapters found in the document structure
   */
  extractChapters(structure: DocumentStructure): Chapter[] {
    return this.core.extractChapters(structure);
  }

  /**
   * Extracts sections and paragraphs from a specific chapter.
   *
   * @param {Chapter} chapter - The chapter to extract sections from
   * @returns {Paragraph[]} An array of paragraphs and sections within the chapter
   */
  extractSections(chapter: Chapter): Paragraph[] {
    return this.core.extractSections(chapter);
  }

  /**
   * Extracts all paragraphs from the document structure.
   *
   * @param {DocumentStructure} structure - The document structure to extract paragraphs from
   * @returns {Paragraph[]} An array of all paragraphs found in the document
   */
  extractParagraphs(structure: DocumentStructure): Paragraph[] {
    return this.core.extractParagraphs(structure);
  }

  /**
   * Extracts individual sentences from a paragraph.
   *
   * @param {Paragraph} paragraph - The paragraph to extract sentences from
   * @returns {Sentence[]} An array of sentences within the paragraph
   */
  extractSentences(paragraph: Paragraph): Sentence[] {
    return this.core.extractSentences(paragraph);
  }

  /**
   * Extracts metadata information from the document structure.
   *
   * @param {DocumentStructure} structure - The document structure to extract metadata from
   * @returns {DocumentMetadata} The metadata information extracted from the document
   */
  getDocumentMetadata(structure: DocumentStructure): DocumentMetadata {
    return this.core.getDocumentMetadata(structure);
  }

  /**
   * Checks if the document structure meets specified quality thresholds.
   *
   * @param {DocumentStructure} structure - The document structure to evaluate for quality
   * @param {number} [threshold] - Optional custom quality threshold to check against
   * @returns {boolean} True if the structure meets the quality thresholds, false otherwise
   */
  meetsQualityThresholds(
    structure: DocumentStructure,
    threshold?: number
  ): boolean {
    return this.core.meetsQualityThresholds(structure, threshold);
  }

  /**
   * Gets the current analyzer configuration.
   *
   * @returns {AnalyzerConfig} The current configuration settings for the analyzer
   */
  getConfig(): AnalyzerConfig {
    return this.core.getConfig();
  }

  /**
   * Updates the analyzer configuration with the specified changes.
   *
   * @param {Partial<AnalyzerConfig>} updates - The configuration updates to apply
   * @returns {void}
   */
  updateConfig(updates: Partial<AnalyzerConfig>): void {
    this.core.updateConfig(updates);
  }
}
