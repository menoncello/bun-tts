/**
 * Type definitions for confidence scoring
 */

/**
 * Structure quality indicators
 */
export interface QualityIndicators {
  /** Chapter structure quality */
  chapterStructure: number;
  /** Paragraph distribution quality */
  paragraphDistribution: number;
  /** Sentence structure quality */
  sentenceStructure: number;
  /** Content quality */
  contentQuality: number;
  /** Metadata quality */
  metadataQuality: number;
}
