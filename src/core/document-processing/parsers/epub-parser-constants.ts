/**
 * Constants for EPUB parser compatibility layer and content validation
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
  '<article',
  '<section',
  '<nav',
  '<aside',
  '<header',
  '<footer',
  '<main',
  '<audio',
  '<video',
  '<canvas',
  '<svg',
  'data-epub',
  'epub:type',
  'xmlns:epub',
] as const;

// File size and content limits
export const FILE_INSPECTION_SIZE = 100;
export const BUFFER_INSPECTION_SIZE = 200;
export const MIN_STRING_LENGTH = 10;
export const MAX_STRING_LENGTH = 100;
export const SHORT_TEXT_THRESHOLD = 50;

// ZIP file signature constants
export const ZIP_SIGNATURE_PK = 0x50;
export const ZIP_SIGNATURE_KB = 0x4B;
export const ZIP_VERSION_03 = 0x03;
export const ZIP_VERSION_05 = 0x05;
export const ZIP_VERSION_07 = 0x07;
export const ZIP_MIN_LENGTH = 4;

// Content validation thresholds
export const NON_PRINTABLE_THRESHOLD_BUFFER = 0.3;
export const NON_PRINTABLE_THRESHOLD_STRING = 0.2;

// Control character ranges
export const CONTROL_CHAR_RANGE_1 = '\\x00-\\x08';
export const CONTROL_CHAR_RANGE_2 = '\\x0B';
export const CONTROL_CHAR_RANGE_3 = '\\x0C';
export const CONTROL_CHAR_RANGE_4 = '\\x0E-\\x1F';
export const CONTROL_CHAR_RANGE_5 = '\\x7F';

// Invalid content patterns
export const INVALID_PATTERNS = [
  'invalid epub content',
  'definitely not epub',
  'not an epub file',
  'random text content',
  'this is not an epub',
] as const;

// Regex patterns
export const NON_PRINTABLE_REGEX = new RegExp(
  `[${CONTROL_CHAR_RANGE_1}${CONTROL_CHAR_RANGE_2}${CONTROL_CHAR_RANGE_3}${CONTROL_CHAR_RANGE_4}${CONTROL_CHAR_RANGE_5}]`,
  'g'
);

export const PATH_SEPARATORS = ['/', '\\'];
