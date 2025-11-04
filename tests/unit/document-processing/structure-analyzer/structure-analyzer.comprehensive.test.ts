/**
 * Comprehensive unit tests for StructureAnalyzer class.
 * Tests all acceptance criteria and integration with existing parsers.
 *
 * Test Quality Improvements:
 * - Uses data factories instead of hardcoded test data
 * - Implements BDD Given-When-Then structure
 * - Follows test priority classification (P0/P1/P2/P3)
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager.js';
import { generateConfidenceReport } from '../../../../src/core/document-processing/confidence-scoring.js';
import { StructureAnalyzer } from '../../../../src/core/document-processing/structure-analyzer.js';
import type { StructureValidationResult } from '../../../../src/core/document-processing/validation-constants.js';
import type { Logger } from '../../../../src/interfaces/logger.js';
import { MockLoggerFactory } from '../../../support/document-processing-factories.js';
import {
  createDocumentStructure,
  createChapter,
  createDocumentMetadata,
} from '../../../support/factories/document-structure-factory.js';

// Magic numbers extracted to named constants for better maintainability
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const CUSTOM_CONFIDENCE_THRESHOLD = 0.8;
const HIGH_CONFIDENCE_THRESHOLD = 0.9;
const CUSTOM_THRESHOLD = 0.85;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const WORD_COUNT_1000 = 1000;
const CHAPTER_WORD_COUNT_500 = 500;
const CHAPTER_WORD_COUNT_100 = 100;
const CHAPTER_WORD_COUNT_200 = 200;

describe('StructureAnalyzer - Comprehensive Tests', () => {
  let analyzer: StructureAnalyzer;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = {
      getConfig: () => null,
      loadConfig: async () => ({ success: true, data: {} }),
      reloadConfig: async () => ({ success: true, data: {} }),
      createSampleConfig: () => 'sample config',
    } as unknown as ConfigManager;

    analyzer = new StructureAnalyzer(mockLogger, mockConfigManager);
  });

  describe('StructureAnalyzer Initialization (P0)', () => {
    test('1.5-INIT-001: should create instance with default configuration', () => {
      // GIVEN: Default StructureAnalyzer constructor parameters
      const expectedLogger = mockLogger;
      const expectedConfigManager = mockConfigManager;

      // WHEN: Creating StructureAnalyzer instance with default configuration
      const result = new StructureAnalyzer(
        expectedLogger,
        expectedConfigManager
      );

      // THEN: Instance is created with expected default configuration
      expect(result).toBeDefined();
      expect(result.getConfig()).toBeDefined();
      expect(result.getConfig().defaultConfidenceThreshold).toBe(
        DEFAULT_CONFIDENCE_THRESHOLD
      );
      expect(result.getConfig().enableStreaming).toBe(true);
      expect(result.getConfig().maxFileSize).toBe(MAX_FILE_SIZE_BYTES);
    });

    test('1.5-INIT-002: should apply configuration overrides', () => {
      // GIVEN: Custom configuration parameters
      const customThreshold = CUSTOM_CONFIDENCE_THRESHOLD;
      const expectedStreamingDisabled = false;

      // WHEN: Creating StructureAnalyzer with configuration overrides
      const result = new StructureAnalyzer(mockLogger, mockConfigManager, {
        defaultConfidenceThreshold: customThreshold,
        enableStreaming: expectedStreamingDisabled,
      });

      // THEN: Configuration overrides are applied correctly
      expect(result.getConfig().defaultConfidenceThreshold).toBe(
        customThreshold
      );
      expect(result.getConfig().enableStreaming).toBe(
        expectedStreamingDisabled
      );
    });
  });

  describe('Confidence Scoring System (AC3) (P0)', () => {
    test('1.5-CONF-001: should generate confidence report for document structure', () => {
      // GIVEN: A well-formed document structure created by factory
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Confidence Scoring',
          wordCount: WORD_COUNT_1000,
        }),
        confidence: CUSTOM_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Generating confidence report for the document structure
      const report = analyzer.generateConfidenceReport(mockStructure);

      // THEN: Confidence report contains valid metrics and structure analysis
      expect(report).toBeDefined();
      expect(report.overall).toBeGreaterThanOrEqual(0);
      expect(report.overall).toBeLessThanOrEqual(1);
      expect(report.chapters).toBeDefined();
      expect(report.chapters.length).toBeGreaterThan(0);
      expect(report.metrics).toBeDefined();
      expect(report.metrics.isWellFormed).toBeDefined();
      expect(report.metrics.meetsThreshold).toBeDefined();
    });

    test('1.5-CONF-002: should calculate confidence for chapters', () => {
      // GIVEN: Document structure with high confidence chapter created by factory
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Chapter Confidence',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [
          createChapter({
            id: 'ch1',
            title: 'Chapter 1: High Confidence',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_500,
            confidence: HIGH_CONFIDENCE_THRESHOLD,
          }),
        ],
        confidence: HIGH_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Generating confidence report with detailed analysis
      const report = generateConfidenceReport(mockStructure, true);

      // THEN: Chapter confidence is calculated with proper factors and scoring
      expect(report.chapters).toBeDefined();
      expect(report.chapters.length).toBeGreaterThan(0);
      expect(report.chapters[0]!.confidence).toBeGreaterThan(0);
      expect(report.chapters[0]!.confidence).toBeLessThanOrEqual(1);
      expect(report.chapters[0]!.factors).toBeDefined();
      expect(report.chapters[0]!.factors.length).toBeGreaterThan(0);
    });
  });

  describe('Validation and Correction Interface (AC4) (P0)', () => {
    test('1.5-VAL-001: should validate document structure', async () => {
      // GIVEN: A valid document structure created by factory with proper content
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Validation',
          wordCount: WORD_COUNT_1000,
        }),
        confidence: DEFAULT_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Validating the document structure
      const validation = (await analyzer.validateAndCorrectStructure(
        mockStructure
      )) as StructureValidationResult;

      // THEN: Validation result contains comprehensive structure analysis
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.overallScore).toBeGreaterThanOrEqual(0);
      expect(validation.overallScore).toBeLessThanOrEqual(1);
      expect(validation.errors).toBeDefined();
      expect(validation.warnings).toBeDefined();
      expect(validation.recommendations).toBeDefined();
    });

    test('1.5-VAL-002: should detect structure quality issues', async () => {
      // GIVEN: An empty document structure with no content to trigger validation errors
      const emptyStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Empty Document',
          wordCount: 0,
        }),
        chapters: [], // No chapters to trigger validation errors
        confidence: 0,
      });

      // WHEN: Validating the empty document structure
      const validation = (await analyzer.validateAndCorrectStructure(
        emptyStructure
      )) as StructureValidationResult;

      // THEN: Validation detects multiple quality issues in empty structure
      expect(validation.errors.length).toBeGreaterThan(0);
      // Empty structure should trigger validation errors
      expect(validation.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TUI Visualization Structure Generation (AC6) (P0)', () => {
    test('1.5-TUI-001: should generate hierarchical document tree', () => {
      // GIVEN: A document structure with chapters and content created by factory
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for TUI Visualization',
          wordCount: WORD_COUNT_1000,
        }),
        confidence: CUSTOM_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Generating hierarchical structure tree for TUI visualization
      const tree = analyzer.generateStructureTree(mockStructure);

      // THEN: Tree structure is properly formatted with document hierarchy
      expect(tree).toBeDefined();
      expect(tree.type).toBe('document');
      expect(tree.children).toBeDefined();
      expect(tree.children.length).toBeGreaterThan(0);
      expect(tree.children[0]!.type).toBe('chapter');
    });

    test('1.5-TUI-002: should provide structure statistics in tree nodes', () => {
      // GIVEN: Document structure with heading paragraphs and high confidence
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Tree Statistics',
          wordCount: WORD_COUNT_1000,
        }),
        confidence: HIGH_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Generating structure tree with statistics
      const tree = analyzer.generateStructureTree(mockStructure);

      // THEN: Tree nodes contain proper display information and statistics
      expect(tree.children).toBeDefined();
      expect(tree.children.length).toBeGreaterThan(0);
      expect(tree.children[0]!.display).toBeDefined();
      expect(tree.children[0]!.display.icon).toBeDefined();
      // Check if confidence exists and is valid
      if (tree.children[0]!.display.confidence !== undefined) {
        expect(typeof tree.children[0]!.display.confidence).toBe('number');
        expect(tree.children[0]!.display.confidence).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Helper Methods (P1)', () => {
    test('1.5-HELP-001: should extract chapters from structure', () => {
      // GIVEN: Document structure with multiple chapters created by factory
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Chapter Extraction',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [
          createChapter({
            id: 'ch1',
            title: 'Chapter 1: First Chapter',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: CUSTOM_CONFIDENCE_THRESHOLD,
          }),
          createChapter({
            id: 'ch2',
            title: 'Chapter 2: Second Chapter',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_200,
            confidence: CUSTOM_CONFIDENCE_THRESHOLD,
          }),
        ],
        confidence: CUSTOM_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Extracting chapters from the document structure
      const chapters = analyzer.extractChapters(mockStructure);

      // THEN: Chapters are extracted with proper titles and structure
      expect(chapters).toBeDefined();
      expect(chapters.length).toBe(2);
      expect(chapters[0]!.title).toBe('Chapter 1: First Chapter');
      expect(chapters[1]!.title).toBe('Chapter 2: Second Chapter');
    });

    test('1.5-HELP-002: should check quality thresholds', () => {
      // GIVEN: Document structure with known confidence level created by factory
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Test Document for Quality Thresholds',
          wordCount: WORD_COUNT_1000,
        }),
        confidence: CUSTOM_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Checking if structure meets different quality thresholds
      const meetsDefaultThreshold = analyzer.meetsQualityThresholds(
        mockStructure,
        DEFAULT_CONFIDENCE_THRESHOLD
      );
      const meetsHighThreshold = analyzer.meetsQualityThresholds(
        mockStructure,
        HIGH_CONFIDENCE_THRESHOLD
      );

      // THEN: Quality threshold evaluation works correctly
      expect(meetsDefaultThreshold).toBe(true);
      expect(meetsHighThreshold).toBe(false);
    });

    test('1.5-HELP-003: should get document metadata', () => {
      // GIVEN: Document structure with comprehensive metadata created by factory
      const expectedTitle = 'Test Document for Metadata Extraction';
      const expectedAuthor = 'Test Author';
      const mockStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: expectedTitle,
          author: expectedAuthor,
          wordCount: WORD_COUNT_1000,
        }),
        confidence: CUSTOM_CONFIDENCE_THRESHOLD,
      });

      // WHEN: Extracting document metadata
      const metadata = analyzer.getDocumentMetadata(mockStructure);

      // THEN: Metadata is extracted correctly with all expected fields
      expect(metadata.title).toBe(expectedTitle);
      expect(metadata.author).toBe(expectedAuthor);
      expect(metadata.wordCount).toBe(WORD_COUNT_1000);
    });
  });

  describe('Configuration Management (P2)', () => {
    test('1.5-CONFIG-001: should update configuration at runtime', () => {
      // GIVEN: Initial StructureAnalyzer configuration
      const originalConfig = analyzer.getConfig();
      const newThreshold = CUSTOM_THRESHOLD;
      const expectedValidationDisabled = false;

      // WHEN: Updating configuration at runtime
      analyzer.updateConfig({
        defaultConfidenceThreshold: newThreshold,
        validateStructure: expectedValidationDisabled,
      });

      // THEN: Configuration is updated with new values while preserving unchanged ones
      const updatedConfig = analyzer.getConfig();
      expect(updatedConfig.defaultConfidenceThreshold).toBe(newThreshold);
      expect(updatedConfig.validateStructure).toBe(expectedValidationDisabled);
      expect(updatedConfig.enableStreaming).toBe(
        originalConfig.enableStreaming
      ); // Unchanged
    });
  });

  describe('Edge Case Handling (AC-5) (P1)', () => {
    test('1.5-EDGE-001: should handle malformed documents with irregular headers', () => {
      // GIVEN: A document structure with malformed and irregular headers
      const malformedStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Malformed Document with Irregular Headers',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [
          createChapter({
            id: 'malformed-chapter-1',
            title: '', // Empty title - malformed header
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: 0.3, // Low confidence due to malformed header
          }),
          createChapter({
            id: 'malformed-chapter-2',
            title: '   ???   WEIRD   ???   ', // Irregular header with excessive whitespace and symbols
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_200,
            confidence: 0.4,
          }),
          createChapter({
            id: 'malformed-chapter-3',
            title: '1234567890', // Numeric header only
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: 0.2,
          }),
        ],
        confidence: 0.3, // Overall low confidence
      });

      // WHEN: Analyzing the malformed document structure
      const confidenceReport =
        analyzer.generateConfidenceReport(malformedStructure);
      const structureTree = analyzer.generateStructureTree(malformedStructure);

      // THEN: Edge cases are handled without errors and structure analysis completes
      expect(confidenceReport).toBeDefined();
      expect(confidenceReport.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceReport.overall).toBeLessThanOrEqual(1);
      expect(structureTree).toBeDefined();
      expect(structureTree.children).toBeDefined();
      expect(structureTree.children.length).toBe(3); // All chapters processed despite malformed headers

      // Test that chapters with empty/irregular titles are still processed
      const emptyTitleChapter = structureTree.children.find(
        (child) => child.data?.chapter?.title === ''
      );
      const irregularTitleChapter = structureTree.children.find((child) =>
        child.data?.chapter?.title?.includes('???')
      );
      expect(emptyTitleChapter).toBeDefined();
      expect(irregularTitleChapter).toBeDefined();
    });

    test('1.5-EDGE-002: should handle documents with missing chapter boundaries', () => {
      // GIVEN: A document structure with missing chapter boundaries
      const noChaptersStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Document with Missing Chapter Boundaries',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [], // No chapters - missing boundaries
        confidence: 0.1, // Very low confidence
      });

      // WHEN: Analyzing document with missing chapter boundaries
      const confidenceReport =
        analyzer.generateConfidenceReport(noChaptersStructure);
      const structureTree = analyzer.generateStructureTree(noChaptersStructure);

      // THEN: Missing chapter boundaries are handled gracefully
      expect(confidenceReport).toBeDefined();
      expect(confidenceReport.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceReport.overall).toBeLessThanOrEqual(1);
      expect(structureTree).toBeDefined();
      expect(structureTree.children).toBeDefined();
      expect(structureTree.children.length).toBe(0); // No chapters to process

      // Test that the analyzer doesn't crash with empty chapters array
      expect(() => analyzer.extractChapters(noChaptersStructure)).not.toThrow();
      const extractedChapters = analyzer.extractChapters(noChaptersStructure);
      expect(extractedChapters).toBeDefined();
      expect(extractedChapters.length).toBe(0);
    });

    test('1.5-EDGE-003: should handle corrupted structure data gracefully', () => {
      // GIVEN: A document structure with potentially problematic data
      const problematicStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Document with Problematic Data',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [
          createChapter({
            id: 'problematic-chapter',
            title: 'Chapter with Problematic Data',
            level: 1,
            wordCount: 0, // Zero word count - potentially problematic
            confidence: 0.1, // Very low confidence
            paragraphs: [], // Empty paragraphs - edge case
          }),
        ],
        confidence: 0.1, // Very low confidence
      });

      // WHEN: Analyzing problematic structure data
      const confidenceReport =
        analyzer.generateConfidenceReport(problematicStructure);
      const structureTree =
        analyzer.generateStructureTree(problematicStructure);

      // THEN: Problematic data is handled without crashes
      expect(confidenceReport).toBeDefined();
      expect(confidenceReport.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceReport.overall).toBeLessThanOrEqual(1);
      expect(structureTree).toBeDefined();
      expect(structureTree.children).toBeDefined();
      expect(structureTree.children.length).toBe(1); // Chapter processed despite issues

      // Test that analyzer handles edge cases without throwing
      expect(() => {
        analyzer.getDocumentMetadata(problematicStructure);
        analyzer.extractChapters(problematicStructure);
        analyzer.meetsQualityThresholds(problematicStructure, 0.5);
      }).not.toThrow();
    });

    test('1.5-EDGE-004: should handle documents with inconsistent formatting', () => {
      // GIVEN: A document structure with inconsistent formatting
      const inconsistentStructure = createDocumentStructure({
        metadata: createDocumentMetadata({
          title: 'Document with Inconsistent Formatting',
          wordCount: WORD_COUNT_1000,
        }),
        chapters: [
          createChapter({
            id: 'inconsistent-chapter-1',
            title: 'CHAPTER 1: UPPERCASE TITLE',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: 0.6, // Medium confidence due to formatting
          }),
          createChapter({
            id: 'inconsistent-chapter-2',
            title: 'chapter 2: lowercase title',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_200,
            confidence: 0.5, // Medium confidence due to inconsistency
          }),
          createChapter({
            id: 'inconsistent-chapter-3',
            title: 'Chapter 3: Mixed Case Title With Inconsistent Formatting',
            level: 3, // Inconsistent level (should be 1 for main chapters)
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: 0.4, // Lower confidence due to level inconsistency
          }),
          createChapter({
            id: 'inconsistent-chapter-4',
            title: '   Chapter 4: Leading and Trailing Spaces   ',
            level: 1,
            wordCount: CHAPTER_WORD_COUNT_100,
            confidence: 0.5, // Medium confidence due to spacing issues
          }),
        ],
        confidence: 0.5, // Overall medium confidence due to inconsistencies
      });

      // WHEN: Analyzing document with inconsistent formatting
      const confidenceReport = analyzer.generateConfidenceReport(
        inconsistentStructure
      );
      const structureTree = analyzer.generateStructureTree(
        inconsistentStructure
      );

      // THEN: Inconsistent formatting is processed without errors
      expect(confidenceReport).toBeDefined();
      expect(confidenceReport.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceReport.overall).toBeLessThanOrEqual(1);
      expect(structureTree).toBeDefined();
      expect(structureTree.children).toBeDefined();
      expect(structureTree.children.length).toBe(4); // All chapters processed despite inconsistencies

      // Test that chapters with different title formats and levels are processed
      const uppercaseChapter = structureTree.children.find((child) =>
        child.data?.chapter?.title?.includes('CHAPTER 1: UPPERCASE')
      );
      const lowercaseChapter = structureTree.children.find((child) =>
        child.data?.chapter?.title?.includes('chapter 2: lowercase')
      );
      const level3Chapter = structureTree.children.find(
        (child) => child.data?.chapter?.level === 3
      );
      const spacedChapter = structureTree.children.find((child) =>
        child.data?.chapter?.title?.includes('Leading and Trailing Spaces')
      );

      expect(uppercaseChapter).toBeDefined();
      expect(lowercaseChapter).toBeDefined();
      expect(level3Chapter).toBeDefined();
      expect(spacedChapter).toBeDefined();
    });
  });
});
