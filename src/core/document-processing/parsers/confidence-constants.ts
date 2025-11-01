/**
 * Constants for document confidence calculation.
 * Contains all magic numbers and thresholds used in confidence scoring.
 */

// Base confidence scores
export const BASE_CONFIDENCE_SCORE = 0.7;
export const MAX_CONFIDENCE_SCORE = 1.0;
export const DEFAULT_NORMAL_CONTENT_CONFIDENCE = 0.75;

// Structure-based confidence thresholds
export const EXCELLENT_STRUCTURE_CHAPTER_THRESHOLD = 5;
export const EXCELLENT_STRUCTURE_BONUS = 0.15;
export const GOOD_STRUCTURE_CHAPTER_THRESHOLD = 3;
export const GOOD_STRUCTURE_BONUS = 0.1;
export const MINIMAL_STRUCTURE_CHAPTER_BONUS = 0.05;

// Paragraph distribution thresholds
export const GOOD_PARAGRAPH_DISTRIBUTION_MIN = 2;
export const GOOD_PARAGRAPH_DISTRIBUTION_MAX = 10;
export const GOOD_PARAGRAPH_DISTRIBUTION_BONUS = 0.1;
export const MINIMAL_PARAGRAPH_DISTRIBUTION_BONUS = 0.05;

// Sentence distribution thresholds
export const GOOD_SENTENCE_DISTRIBUTION_MIN = 2;
export const GOOD_SENTENCE_DISTRIBUTION_MAX = 4;
export const GOOD_SENTENCE_DISTRIBUTION_BONUS = 0.1;
export const MINIMAL_SENTENCE_DISTRIBUTION_BONUS = 0.05;

// Content size thresholds
export const COMPREHENSIVE_CONTENT_THRESHOLD = 500;
export const COMPREHENSIVE_CONTENT_BONUS = 0.15;
export const SUBSTANTIAL_CONTENT_THRESHOLD = 200;
export const SUBSTANTIAL_CONTENT_BONUS = 0.1;
export const MINIMAL_CONTENT_THRESHOLD = 100;
export const MINIMAL_CONTENT_BONUS = 0.05;

// Edge case thresholds
export const SINGLE_CHARACTER_CONFIDENCE = 0.8;
export const EXTREMELY_MINIMAL_WORD_THRESHOLD = 3;
export const EXTREMELY_MINIMAL_CONFIDENCE = 0.2;
export const EXTREMELY_MINIMAL_STRUCTURE_CONFIDENCE = 0.6;
export const NO_CLEAR_STRUCTURE_CONFIDENCE = 0.8;
export const MINIMAL_STRUCTURE_CONTENT_THRESHOLD = 20;
export const CONTENT_WITH_STRUCTURE_CONFIDENCE = 0.85;
export const REASONABLE_CONTENT_THRESHOLD = 20;
export const REASONABLE_CONTENT_CONFIDENCE = 0.8;

// Content structure thresholds
export const CONTENT_STRUCTURE_THRESHOLD = 10;
export const CONTENT_STRUCTURE_WORD_THRESHOLD = 1;

// Special elements confidence
export const SPECIAL_ELEMENTS_CONFIDENCE_BONUS = 0.1;

// Duration calculation constants
export const WORD_DURATION_FACTOR = 0.2; // seconds per word for TTS estimation (5 words per second)
