/**
 * Error handling utilities for StructureAnalyzerCore.
 * Contains methods for creating error results and handling parsing failures.
 */

import type {
  DocumentStructure,
  ConfidenceReport,
  DocumentTreeNode,
} from './types';
import type {
  DocumentFormat,
  StructureAnalysisResult,
} from './types/structure-analyzer-types';

/**
 * Error handling utilities for StructureAnalyzerCore.
 */
export class StructureAnalyzerErrorHandler {
  /**
   * Extracts error message from error object.
   * @param {unknown} error - The error to extract message from
   * @returns {string} The extracted error message
   */
  static extractErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Creates minimal document structure for error cases.
   * @param {string} errorMessage - The error message to include
   * @param {number} startTime - The start time for processing metrics
   * @returns {DocumentStructure} A minimal document structure with error information
   */
  static createMinimalErrorStructure(
    errorMessage: string,
    startTime: number
  ): DocumentStructure {
    return {
      metadata: {
        title: 'Error Document',
        wordCount: 0,
        totalWords: 0,
        totalChapters: 0,
        customMetadata: {},
      },
      chapters: [],
      totalParagraphs: 0,
      totalSentences: 0,
      totalWordCount: 0,
      totalChapters: 0,
      estimatedTotalDuration: 0,
      confidence: 0,
      processingMetrics: {
        parseStartTime: new Date(),
        parseEndTime: new Date(),
        parseDurationMs: Date.now() - startTime,
        sourceLength: 0,
        processingErrors: [errorMessage],
      },
    };
  }

  /**
   * Creates confidence report for error cases.
   * @param {string} errorMessage - The error message to include
   * @returns {ConfidenceReport} An error confidence report
   */
  static createErrorConfidenceReport(errorMessage: string): ConfidenceReport {
    return {
      overall: 0,
      chapters: [],
      paragraphs: { average: 0, distribution: [] },
      sentences: { average: 0, totalCount: 0 },
      structureFactors: [],
      metrics: {
        isWellFormed: false,
        meetsThreshold: false,
        riskLevel: 'high' as const,
        recommendations: [errorMessage],
      },
    };
  }

  /**
   * Creates document tree for error cases.
   * @param {string} errorMessage - The error message to include
   * @returns {DocumentTreeNode} An error document tree
   */
  static createErrorDocumentTree(errorMessage: string): DocumentTreeNode {
    return {
      id: 'root',
      label: 'Error Document',
      type: 'document',
      level: 0,
      children: [],
      display: {
        hasIssues: true,
        confidence: 0,
        metadata: { error: errorMessage },
      },
    };
  }

  /**
   * Builds an error result when analysis fails.
   * @param {DocumentFormat} format - The document format that was being analyzed
   * @param {number} startTime - The timestamp when analysis started (for performance metrics)
   * @param {Error} error - The error that occurred during analysis
   * @param {string} errorMessage - The formatted error message to include in the result
   * @returns {StructureAnalysisResult} A structure analysis result containing error information
   */
  static buildErrorResult(
    format: DocumentFormat,
    startTime: number,
    error: Error,
    errorMessage: string
  ): StructureAnalysisResult {
    const minimalStructure = this.createMinimalErrorStructure(
      errorMessage,
      startTime
    );
    const errorConfidence = this.createErrorConfidenceReport(errorMessage);
    const errorTree = this.createErrorDocumentTree(errorMessage);

    return {
      format,
      documentStructure: minimalStructure,
      confidence: errorConfidence,
      structureTree: errorTree,
      validation: null,
      processingTime: Date.now() - startTime,
    };
  }
}
