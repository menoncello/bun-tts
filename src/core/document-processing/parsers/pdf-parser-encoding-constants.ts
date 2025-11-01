/**
 * Constants for PDF parser encoding utilities.
 * Defines encoding constants, thresholds, and configuration values.
 */

// Constants for BOM detection
export const UTF8_BOM = 0xFEFF;
export const UTF16LE_BOM = 0xFFFE;
export const UTF16BE_BOM = 0xFEFF;
export const UTF32LE_BOM = 0x0000FFFE;
export const UTF32BE_BOM = 0xFFFE0000;
export const UTF8_BOM_BYTES = 0xEFBBBF;

// Constants for confidence thresholds
export const HIGH_CONFIDENCE_THRESHOLD = 0.5;
export const LOW_CONFIDENCE_THRESHOLD = 0.2;

// Constants for character code analysis
export const ASCII_CHARACTER_RANGE_MAX = 0x0080;
export const LATIN1_CHARACTER_RANGE_MAX = 0x00FF;

// Constants for encoding detection
export const HIGH_ENCODING_CONFIDENCE = 0.8;
export const MEDIUM_ENCODING_CONFIDENCE = 0.7;
export const LOW_ENCODING_CONFIDENCE = 0.5;
export const HIGH_NON_ASCII_RATIO = 0.5;
export const MEDIUM_HIGH_NON_ASCII_RATIO = 0.3;
export const MEDIUM_LOW_NON_ASCII_RATIO = 0.1;
export const LOW_NON_ASCII_RATIO = 0.05;

// Constants for text alignment detection
export const LEFT_ALIGNED_THRESHOLD = 0.8;
export const RIGHT_ALIGNED_THRESHOLD = 0.2;

// Encoding name constants
export const ENCODING_UTF8 = 'utf-8' as const;
export const ENCODING_UTF8_BOM = 'utf-8-bom' as const;
export const ENCODING_UTF16LE = 'utf-16le' as const;
export const ENCODING_UTF16BE = 'utf-16be' as const;
export const ENCODING_UTF32LE = 'utf-32le' as const;
export const ENCODING_UTF32BE = 'utf-32be' as const;
export const ENCODING_WINDOWS1252 = 'windows-1252' as const;
export const ENCODING_ISO8859_1 = 'iso-8859-1' as const;
export const ENCODING_ISO8859_2 = 'iso-8859-2' as const;
export const ENCODING_ISO8859_15 = 'iso-8859-15' as const;
export const ENCODING_ASCII = 'ascii' as const;
export const ENCODING_GB2312 = 'gb2312' as const;
export const ENCODING_SHIFT_JIS = 'shift_jis' as const;
export const ENCODING_EUC_KR = 'euc-kr' as const;
export const ENCODING_BIG5 = 'big5' as const;

// Encoding type definitions
export const SUPPORTED_ENCODINGS = [
  ENCODING_UTF8,
  ENCODING_UTF8_BOM,
  ENCODING_UTF16LE,
  ENCODING_UTF16BE,
  ENCODING_UTF32LE,
  ENCODING_UTF32BE,
  ENCODING_WINDOWS1252,
  ENCODING_ISO8859_1,
  ENCODING_ISO8859_2,
  ENCODING_ISO8859_15,
  ENCODING_ASCII,
  ENCODING_GB2312,
  ENCODING_SHIFT_JIS,
  ENCODING_EUC_KR,
  ENCODING_BIG5,
] as const;

// Legacy encoding group
export const LEGACY_ENCODINGS = [
  ENCODING_WINDOWS1252,
  ENCODING_ISO8859_1,
  ENCODING_ISO8859_2,
  ENCODING_ISO8859_15,
] as const;

// CJK encoding group
export const CJK_ENCODINGS = [
  ENCODING_GB2312,
  ENCODING_SHIFT_JIS,
  ENCODING_EUC_KR,
  ENCODING_BIG5,
] as const;

// UTF encoding group
export const UTF_ENCODINGS = [
  ENCODING_UTF8,
  ENCODING_UTF8_BOM,
  ENCODING_UTF16LE,
  ENCODING_UTF16BE,
  ENCODING_UTF32LE,
  ENCODING_UTF32BE,
] as const;

// RTL language detection ranges
export const ARABIC_RANGE = { start: 0x0600, end: 0x06FF };
export const HEBREW_RANGE = { start: 0x0590, end: 0x05FF };
export const RTL_THRESHOLD = 0.1;

// CJK detection patterns
export const CJK_RANGES = [
  { start: 0x4E00, end: 0x9FFF, name: 'CJK Unified Ideographs' },
  { start: 0x3040, end: 0x30FF, name: 'Hiragana/Katakana' },
  { start: 0xAC00, end: 0xD7AF, name: 'Hangul Syllables' },
];

// High surrogate range for UTF-16
export const UTF16_HIGH_SURROGATE_MIN = 0xD800;
export const UTF16_HIGH_SURROGATE_MAX = 0xDBFF;
export const UTF16_LOW_SURROGATE_MIN = 0xDC00;
export const UTF16_LOW_SURROGATE_MAX = 0xDFFF;

// Bitmask for high 16 bits
export const HIGH_16_BIT_MASK = 0xFFFF0000;

// Null character ratio threshold for UTF-32 detection
export const NULL_RATIO_THRESHOLD_FOR_UTF32 = 0.3;

// Every other position null ratio for UTF-16 BE detection
export const EVERY_OTHER_POSITION_RATIO_THRESHOLD = 0.3;

// BOM confidence boost
export const BOM_CONFIDENCE_BOOST = 0.2;
