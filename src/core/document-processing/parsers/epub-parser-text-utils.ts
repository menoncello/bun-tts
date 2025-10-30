/**
 * EPUB Parser Text Utilities
 * Text processing and extraction utilities for EPUB parsing
 */

// Re-export functions from specialized modules
export {
  stripHTMLAndClean,
  stripHTMLTagsOnly,
  countWords,
  extractParagraphMatches,
  createSentenceObjectLegacy,
  createSentenceObject,
  createRegExpExecArray,
} from './epub-parser-text-extraction.js';

export {
  extractSentenceMatches,
  extractSentenceText,
} from './epub-parser-sentence-processing.js';

export { addRemainingTextAsSentence } from './epub-parser-sentence-remaining.js';
