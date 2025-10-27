/**
 * Constants for EPUB parser compatibility layer
 */

/**
 * Maximum number of spine items to check during structure analysis
 */
export const STRUCTURE_ANALYSIS_SAMPLE_SIZE = 5;

/**
 * Number of content files to sample for compatibility analysis
 */
export const CONTENT_ANALYSIS_SAMPLE_SIZE = 3;

/**
 * HTML5 tag indicators for EPUB version detection
 */
export const HTML5_INDICATORS = [
  '<audio',
  '<video',
  '<canvas',
  '<svg',
  'data-epub',
  'epub:type',
  'xmlns:epub',
] as const;
