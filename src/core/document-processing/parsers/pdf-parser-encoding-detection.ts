import {
  UTF8_BOM,
  UTF16LE_BOM,
  UTF16BE_BOM,
  UTF32LE_BOM,
  UTF32BE_BOM,
  ASCII_CHARACTER_RANGE_MAX,
  MEDIUM_HIGH_NON_ASCII_RATIO,
  MEDIUM_LOW_NON_ASCII_RATIO,
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
  ENCODING_SHIFT_JIS,
  ENCODING_EUC_KR,
  ENCODING_BIG5,
  LEGACY_ENCODINGS,
  CJK_ENCODINGS,
  UTF_ENCODINGS,
  UTF16_HIGH_SURROGATE_MIN,
  UTF16_HIGH_SURROGATE_MAX,
  UTF16_LOW_SURROGATE_MIN,
  UTF16_LOW_SURROGATE_MAX,
  HIGH_16_BIT_MASK,
  NULL_RATIO_THRESHOLD_FOR_UTF32,
} from './pdf-parser-encoding-constants';
import { detectCharacterScript } from './pdf-parser-text-analysis';
// Maximum number of characters to sample for encoding detection
const MAX_SAMPLE_SIZE = 10;
// Even-odd position index for UTF-16 BE detection
const EVEN_POSITION_INDEX = 2;
// Minimum non-ASCII ratio for ASCII detection
const MIN_NON_ASCII_RATIO_FOR_ASCII = 0.05;
// Minimum CJK ratio for CJK encoding detection
const MIN_CJK_RATIO_FOR_CJK = 0.1;
// Minimum length for multi-byte encoding detection
const MIN_TEXT_LENGTH_FOR_MULTI_BYTE = 2;
// High confidence score for script-encoding matches
const HIGH_CONFIDENCE_SCORE = 0.8;
// Medium-high confidence score
const MEDIUM_HIGH_CONFIDENCE_SCORE = 0.7;
// Medium confidence score
const MEDIUM_CONFIDENCE_SCORE = 0.5;
// BOM confidence boost amount
const BOM_CONFIDENCE_BOOST = 0.2;
// Maximum confidence score
const MAX_CONFIDENCE_SCORE = 1.0;
/**
 * Calculates the ratio of non-ASCII characters in the given text.
 * @param {string} text - The text to analyze
 * @returns {number} The ratio of non-ASCII characters (0.0 to 1.0)
 */
function calculateNonAsciiRatio(text: string): number {
  const totalChars = text.length;
  if (totalChars === 0) return 0;
  const nonAsciiCount = [...text].reduce(
    (count, char) =>
      count + (char.charCodeAt(0) >= ASCII_CHARACTER_RANGE_MAX ? 1 : 0),
    0
  );
  return nonAsciiCount / totalChars;
}
/**
 * Checks if the text has a specific BOM (Byte Order Mark) value.
 * @param {string} text - The text to check
 * @param {number} bomValue - The BOM value to look for
 * @returns {boolean} True if the text starts with the specified BOM value
 */
function hasBom(text: string, bomValue: number): boolean {
  return text.charCodeAt(0) === bomValue;
}
/**
 * Detects UTF-32 encoding (LE or BE) from character codes.
 * @param {number[]} charCodes - Array of character codes
 * @returns {string|null} UTF-32 LE, UTF-32 BE, or null if not detected
 */
function detectUtf32Encoding(
  charCodes: number[]
): 'utf-32le' | 'utf-32be' | null {
  const nullCharCount = charCodes.filter((code) => code === 0).length;
  const nullRatio = nullCharCount / charCodes.length;
  if (nullRatio > NULL_RATIO_THRESHOLD_FOR_UTF32) {
    const hasHighNulls = charCodes
      .slice(0, MAX_SAMPLE_SIZE)
      .some((code) => (code & HIGH_16_BIT_MASK) !== 0);
    return hasHighNulls ? ENCODING_UTF32LE : ENCODING_UTF32BE;
  }
  return null;
}
/**
 * Detects UTF-16 encoding (LE or BE) from character codes.
 * @param {number[]} charCodes - Array of character codes
 * @returns {string|null} UTF-16 LE, UTF-16 BE, or null if not detected
 */
function detectUtf16Encoding(charCodes: number[]): string | null {
  const highSurrogateCount = charCodes.filter(
    (code) =>
      code >= UTF16_HIGH_SURROGATE_MIN && code <= UTF16_HIGH_SURROGATE_MAX
  ).length;
  const lowSurrogateCount = charCodes.filter(
    (code) => code >= UTF16_LOW_SURROGATE_MIN && code <= UTF16_LOW_SURROGATE_MAX
  ).length;
  if (highSurrogateCount > 0 && lowSurrogateCount > 0) return ENCODING_UTF16LE;
  const everyOtherNull = charCodes.filter(
    (code, i) => i % EVEN_POSITION_INDEX === 0 && code === 0
  ).length;
  if (everyOtherNull > charCodes.length) return ENCODING_UTF16BE;
  return null;
}
/**
 * Detects multi-byte encoding (UTF-32 or UTF-16) in the text.
 * @param {string} text - The text to analyze
 * @returns {string|null} The detected encoding or null
 */
function detectMultiByteEncoding(text: string): string | null {
  if (text.length < MIN_TEXT_LENGTH_FOR_MULTI_BYTE) return null;
  const charCodes = [...text].map((char) => char.charCodeAt(0));
  const utf32Encoding = detectUtf32Encoding(charCodes);
  if (utf32Encoding) return utf32Encoding;
  const utf16Encoding = detectUtf16Encoding(charCodes);
  if (utf16Encoding) return utf16Encoding;
  return null;
}
const hasWindows1252Specific = (text: string): boolean =>
  /[€„‚ƒ…†‡ˆ‰Š‹ŒŽ"'•–—˜™š›œžÿ]/u.test(text);
const hasExtendedLatin = (text: string): boolean =>
  /[\u00A0-\u00FF]/u.test(text);
const hasIso88592Specific = (text: string): boolean =>
  /[ĄĆČĘŁŃÓŚŹŻąćęłńóśźż]/u.test(text);
const hasEuroSymbol = (text: string): boolean => text.includes('€');
/**
 * Detects legacy single-byte encoding from the text.
 * @param {string} text - The text to analyze
 * @param {number} nonAsciiRatio - Ratio of non-ASCII characters
 * @returns {string|null} The detected legacy encoding or null
 */
function detectLegacyEncoding(
  text: string,
  nonAsciiRatio: number
): string | null {
  if (nonAsciiRatio < MIN_NON_ASCII_RATIO_FOR_ASCII) return ENCODING_ASCII;
  if (hasWindows1252Specific(text)) return ENCODING_WINDOWS1252;
  if (hasExtendedLatin(text)) return ENCODING_ISO8859_1;
  if (hasIso88592Specific(text)) return ENCODING_ISO8859_2;
  if (hasEuroSymbol(text)) return ENCODING_ISO8859_15;
  return null;
}
const hasJapanese = (text: string): boolean => /[\u3040-\u30FF]/u.test(text);
const hasKorean = (text: string): boolean => /[\uAC00-\uD7AF]/u.test(text);
const hasChineseCommon = (text: string): boolean =>
  /[\u4E00-\u9FFF]/u.test(text);
/**
 * Detects CJK (Chinese, Japanese, Korean) encoding based on script analysis.
 * @param {string} text - The text to analyze
 * @param {{hasCjk: boolean; cjkRatio: number}} scriptAnalysis - Script analysis results
 * @param {boolean} scriptAnalysis.hasCjk - Whether text contains CJK characters
 * @param {number} scriptAnalysis.cjkRatio - Ratio of CJK characters
 * @returns {string|null} The detected CJK encoding or null
 */
function detectCjkEncoding(
  text: string,
  scriptAnalysis: { hasCjk: boolean; cjkRatio: number }
): string | null {
  if (!scriptAnalysis.hasCjk || scriptAnalysis.cjkRatio < MIN_CJK_RATIO_FOR_CJK)
    return null;
  if (hasJapanese(text)) return ENCODING_SHIFT_JIS;
  if (hasKorean(text)) return ENCODING_EUC_KR;
  if (hasChineseCommon(text)) return ENCODING_BIG5;
  return null;
}
/**
 * Detects the encoding of the given text.
 * @param {string} text - The text to analyze
 * @returns {string} The detected encoding
 */
export function detectEncoding(text: string): string {
  if (!text || text.length === 0) return ENCODING_UTF8;
  const bomEncoding = detectBomEncoding(text);
  if (bomEncoding) return bomEncoding;
  return detectNonBomEncoding(text);
}
/**
 * Detects encoding based on BOM (Byte Order Mark).
 * @param {string} text - The text to analyze
 * @returns {string|null} The BOM-based encoding or null
 */
function detectBomEncoding(text: string): string | null {
  if (hasBom(text, UTF8_BOM)) return ENCODING_UTF8_BOM;
  if (hasBom(text, UTF16LE_BOM)) return ENCODING_UTF16LE;
  if (hasBom(text, UTF16BE_BOM)) return ENCODING_UTF16BE;
  return null;
}
/**
 * Detects encoding for text without BOM.
 * @param {string} text - The text to analyze
 * @returns {string} The detected encoding
 */
function detectNonBomEncoding(text: string): string {
  const scriptAnalysis = detectCharacterScript(text);
  const multiByteEncoding = detectMultiByteEncoding(text);
  if (multiByteEncoding) return multiByteEncoding;
  const nonAsciiRatio = calculateNonAsciiRatio(text);
  const cjkEncoding = detectCjkEncoding(text, scriptAnalysis);
  if (cjkEncoding) return cjkEncoding;
  const legacyEncoding = detectLegacyEncoding(text, nonAsciiRatio);
  if (legacyEncoding) return legacyEncoding;
  return getFallbackEncoding(nonAsciiRatio);
}
/**
 * Gets the fallback encoding based on non-ASCII ratio.
 * @param {number} nonAsciiRatio - Ratio of non-ASCII characters
 * @returns {string} The fallback encoding
 */
function getFallbackEncoding(nonAsciiRatio: number): string {
  if (nonAsciiRatio > MEDIUM_HIGH_NON_ASCII_RATIO) return ENCODING_UTF8;
  if (nonAsciiRatio > MEDIUM_LOW_NON_ASCII_RATIO) return ENCODING_ISO8859_1;
  return ENCODING_ASCII;
}
/**
 * Calculates confidence score for the detected encoding.
 * @param {string} text - The text to analyze
 * @returns {number} Confidence score (0.0 to 1.0)
 */
export function calculateEncodingConfidence(text: string): number {
  const totalChars = text.length;
  if (totalChars === 0) return 0;
  const scriptAnalysis = detectCharacterScript(text);
  const detectedEncoding = detectEncoding(text);
  const confidence = calculateBaseConfidence(detectedEncoding, scriptAnalysis);
  return boostConfidenceForBom(text, confidence);
}
/**
 * Calculates base confidence score based on encoding and script analysis.
 * @param {string} detectedEncoding - The detected encoding
 * @param {{hasCjk: boolean; cjkRatio: number; hasRtl: boolean; rtlRatio: number}} scriptAnalysis - Script analysis results
 * @param {boolean} scriptAnalysis.hasCjk - Whether text contains CJK characters
 * @param {number} scriptAnalysis.cjkRatio - Ratio of CJK characters
 * @param {boolean} scriptAnalysis.hasRtl - Whether text contains RTL characters
 * @param {number} scriptAnalysis.rtlRatio - Ratio of RTL characters
 * @returns {number} Base confidence score
 */
function calculateBaseConfidence(
  detectedEncoding: string,
  scriptAnalysis: {
    hasCjk: boolean;
    cjkRatio: number;
    hasRtl: boolean;
    rtlRatio: number;
  }
): number {
  const highConfidence = getHighConfidenceScore(
    detectedEncoding,
    scriptAnalysis
  );
  if (highConfidence !== null) return highConfidence;
  const mediumHighConfidence = getMediumHighConfidenceScore(detectedEncoding);
  if (mediumHighConfidence !== null) return mediumHighConfidence;
  return MEDIUM_CONFIDENCE_SCORE;
}
/**
 * Gets high confidence score for specific encoding patterns.
 * @param {string} detectedEncoding - The detected encoding
 * @param {{hasCjk: boolean; cjkRatio: number; hasRtl: boolean; rtlRatio: number}} scriptAnalysis - Script analysis results
 * @param {boolean} scriptAnalysis.hasCjk - Whether text contains CJK characters
 * @param {number} scriptAnalysis.cjkRatio - Ratio of CJK characters
 * @param {boolean} scriptAnalysis.hasRtl - Whether text contains RTL characters
 * @param {number} scriptAnalysis.rtlRatio - Ratio of RTL characters
 * @returns {number|null} High confidence score or null
 */
function getHighConfidenceScore(
  detectedEncoding: string,
  scriptAnalysis: {
    hasCjk: boolean;
    cjkRatio: number;
    hasRtl: boolean;
    rtlRatio: number;
  }
): number | null {
  if (
    detectedEncoding === ENCODING_ASCII &&
    scriptAnalysis.cjkRatio === 0 &&
    scriptAnalysis.rtlRatio === 0
  )
    return HIGH_CONFIDENCE_SCORE;

  if (
    scriptAnalysis.hasCjk &&
    CJK_ENCODINGS.includes(detectedEncoding as (typeof CJK_ENCODINGS)[number])
  )
    return HIGH_CONFIDENCE_SCORE;

  if (
    scriptAnalysis.hasRtl &&
    UTF_ENCODINGS.includes(detectedEncoding as (typeof UTF_ENCODINGS)[number])
  )
    return HIGH_CONFIDENCE_SCORE;
  return null;
}
/**
 * Gets medium-high confidence score for legacy and UTF encodings.
 * @param {string} detectedEncoding - The detected encoding
 * @returns {number|null} Medium-high confidence score or null
 */
function getMediumHighConfidenceScore(detectedEncoding: string): number | null {
  if (
    LEGACY_ENCODINGS.includes(
      detectedEncoding as (typeof LEGACY_ENCODINGS)[number]
    )
  )
    return MEDIUM_HIGH_CONFIDENCE_SCORE;
  if (detectedEncoding.startsWith('utf-')) return MEDIUM_HIGH_CONFIDENCE_SCORE;
  return null;
}
/**
 * Boosts confidence score if BOM is detected.
 * @param {string} text - The text to analyze
 * @param {number} currentConfidence - Current confidence score
 * @returns {number} Boosted confidence score
 */
function boostConfidenceForBom(
  text: string,
  currentConfidence: number
): number {
  const bomValues = [
    UTF8_BOM,
    UTF16LE_BOM,
    UTF16BE_BOM,
    UTF32LE_BOM,
    UTF32BE_BOM,
  ];
  if (bomValues.includes(text.charCodeAt(0))) {
    return Math.min(
      MAX_CONFIDENCE_SCORE,
      currentConfidence + BOM_CONFIDENCE_BOOST
    );
  }
  return currentConfidence;
}
/**
 * Checks if the text has a UTF-8 or UTF-16 LE BOM.
 * @param {string} text - The text to check
 * @returns {boolean} True if text has UTF-8 or UTF-16 LE BOM
 */
export function hasBOM(text: string): boolean {
  return text.charCodeAt(0) === UTF8_BOM || text.charCodeAt(0) === UTF16LE_BOM;
}
