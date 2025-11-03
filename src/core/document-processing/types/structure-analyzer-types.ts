/**
 * StructureAnalyzer specific types.
 * Provides interfaces for unified document structure analysis across formats.
 */

import type { DocumentFormat } from '../structure-analyzer.core';
import type { StructureValidationResult } from '../validation-constants';
import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
} from './document-structure-types';
import type { ValidationResult } from './validation-types';

export type { DocumentFormat } from '../structure-analyzer.core';

/**
 * Tree node for TUI document structure visualization
 */
export interface DocumentTreeNode {
  /** Unique node identifier */
  id: string;
  /** Node label for display */
  label: string;
  /** Node type (document, chapter, section, paragraph, sentence) */
  type: 'document' | 'chapter' | 'section' | 'paragraph' | 'sentence';
  /** Nesting level (0-based) */
  level: number;
  /** Child nodes */
  children: DocumentTreeNode[];
  /** Associated data (chapter, paragraph, sentence) */
  data?: {
    chapter?: Chapter;
    paragraph?: Paragraph;
    sentence?: Sentence;
    index?: number;
  };
  /** Display properties */
  display: {
    /** Whether node is expanded (for interactive TUI) */
    expanded?: boolean;
    /** Whether node has errors or warnings */
    hasIssues?: boolean;
    /** Confidence score for this node (0-1) */
    confidence?: number;
    /** Icon or symbol for node type */
    icon?: string;
    /** Metadata for rendering */
    metadata?: Record<string, unknown>;
  };
  /** Position in document */
  position?: {
    chapter: number;
    paragraph?: number;
    sentence?: number;
  };
}

/**
 * Risk level type
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Confidence report for document structure analysis
 */
export interface ConfidenceReport {
  /** Overall confidence score (0-1) */
  overall: number;
  /** Chapter-level confidence scores */
  chapters: Array<{
    id: string;
    title: string;
    confidence: number;
    factors: Array<{
      name: string;
      score: number;
      weight: number;
    }>;
  }>;
  /** Paragraph-level confidence summary */
  paragraphs: {
    average: number;
    distribution: Array<{
      range: string; // e.g., "0.8-1.0", "0.6-0.8"
      count: number;
    }>;
  };
  /** Sentence-level confidence summary */
  sentences: {
    average: number;
    totalCount: number;
  };
  /** Structure detection factors */
  structureFactors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  /** Quality metrics */
  metrics: {
    /** Whether structure is well-formed */
    isWellFormed: boolean;
    /** Whether confidence meets threshold */
    meetsThreshold: boolean;
    /** Risk level of structure detection */
    riskLevel: RiskLevel;
    /** Recommendations for improvement */
    recommendations: string[];
  };
  /** Detailed breakdown (optional) */
  detailed?: {
    chapterBreakdown: Array<{
      chapterId: string;
      wordCount: number;
      paragraphCount: number;
      sentenceCount: number;
      confidence: number;
      issues: string[];
    }>;
    edgeCases: Array<{
      type: string;
      location: string;
      description: string;
      impact: RiskLevel;
    }>;
  };
}

/**
 * Structure analysis options
 */
export interface StructureAnalysisOptions {
  /** Enable detailed confidence reporting */
  detailedConfidence?: boolean;
  /** Custom confidence threshold (0-1) */
  confidenceThreshold?: number;
  /** Include edge case detection */
  detectEdgeCases?: boolean;
  /** Enable validation */
  validateStructure?: boolean;
  /** Generate TUI tree */
  generateTree?: boolean;
  /** Validation options */
  validationOptions?: StructureValidatorOptions;
  /** Extract statistics */
  extractStatistics?: boolean;
  /** Streaming configuration */
  streaming?: {
    /** Enable streaming for large documents */
    enabled: boolean;
    /** Chunk size for streaming */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: {
      processed: number;
      total: number;
      percentage: number;
    }) => void;
  };
}

/**
 * Structure analysis result
 */
export interface StructureAnalysisResult {
  /** Document format */
  format: DocumentFormat;
  /** Parsed document structure */
  documentStructure: DocumentStructure;
  /** Confidence report */
  confidence: ConfidenceReport;
  /** Hierarchical structure tree for TUI */
  structureTree: DocumentTreeNode;
  /** Validation results */
  validation: StructureValidationResult | null;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Additional statistics */
  statistics?: {
    /** Chapters per minute (reading speed estimate) */
    chaptersPerMinute?: number;
    /** Estimated reading time */
    estimatedReadingTimeMinutes?: number;
    /** Complexity score */
    complexityScore?: number;
    /** Structure quality score */
    structureQualityScore?: number;
  };
}

/**
 * Structure validator options
 */
export interface StructureValidatorOptions {
  /** Minimum acceptable confidence (0-1) */
  minConfidence?: number;
  /** Maximum allowed warnings */
  maxWarnings?: number;
  /** Strict mode (fail on warnings) */
  strict?: boolean;
  /** Custom validation rules */
  customRules?: Array<{
    name: string;
    validate: (structure: DocumentStructure) => ValidationResult;
  }>;
  /** Enable automatic corrections */
  enableAutoCorrection?: boolean;
  /** Require manual review for low confidence */
  requireManualReviewBelow?: number;
}

/**
 * Structure correction interface
 */
export interface StructureCorrection {
  /** Type of correction */
  type:
    | 'chapter_split'
    | 'chapter_merge'
    | 'paragraph_adjust'
    | 'confidence_recalibrate'
    | 'boundary_move';
  /** Location of correction */
  location: {
    chapter?: number;
    paragraph?: number;
    sentence?: number;
  };
  /** Description of correction */
  description: string;
  /** Confidence improvement */
  confidenceDelta?: number;
  /** Applied successfully */
  applied: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Structure correction result
 */
export interface StructureCorrectionResult {
  /** Original structure confidence */
  originalConfidence: number;
  /** Corrected structure confidence */
  correctedConfidence: number;
  /** List of corrections applied */
  corrections: StructureCorrection[];
  /** Whether validation now passes */
  validationPassed: boolean;
  /** Remaining issues */
  remainingIssues: Array<{
    type: string;
    severity: RiskLevel;
    description: string;
    location?: string;
  }>;
}

/**
 * Document statistics for reporting
 */
export interface DocumentStatistics {
  /** Chapter statistics */
  chapters: {
    total: number;
    averageLength: number;
    longest: {
      index: number;
      title: string;
      wordCount: number;
    };
    shortest: {
      index: number;
      title: string;
      wordCount: number;
    };
  };
  /** Paragraph statistics */
  paragraphs: {
    total: number;
    averagePerChapter: number;
    distribution: Array<{
      count: number;
      percentage: number;
    }>;
  };
  /** Sentence statistics */
  sentences: {
    total: number;
    averagePerParagraph: number;
    longest: {
      text: string;
      wordCount: number;
    };
  };
  /** Document metadata */
  metadata: {
    totalWordCount: number;
    totalCharacterCount: number;
    estimatedReadingTimeMinutes: number;
    complexityScore: number;
    structureScore: number;
  };
}

/**
 * Edge case detection result
 */
export interface EdgeCaseDetection {
  /** Whether document has irregular formatting */
  hasIrregularFormatting: boolean;
  /** Whether headers are missing */
  hasMissingHeaders: boolean;
  /** List of edge cases found */
  cases: Array<{
    type:
      | 'missing_header'
      | 'irregular_paragraph'
      | 'unusual_sentence_length'
      | 'potential_structure_issue';
    severity: RiskLevel;
    location: string;
    description: string;
    suggestion?: string;
  }>;
  /** Fallback strategy used */
  fallbackStrategy?: {
    applied: boolean;
    type: 'default_structure' | 'content_based' | 'heuristic';
    confidence: number;
  };
}
