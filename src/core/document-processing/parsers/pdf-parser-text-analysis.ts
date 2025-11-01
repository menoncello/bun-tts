/**
 * Text analysis utilities for PDF parser.
 * Handles character script detection, RTL text detection, and text alignment analysis.
 */

import {
  ARABIC_RANGE,
  HEBREW_RANGE,
  RTL_THRESHOLD,
  CJK_RANGES,
  LATIN1_CHARACTER_RANGE_MAX,
} from './pdf-parser-encoding-constants';

/**
 * Text alignment detection constants
 */
const LEFT_ALIGNED_THRESHOLD = 0.8;
const CENTER_ALIGNED_THRESHOLD = 0.2;

/**
 * Character script analysis result
 */
export interface CharacterScriptAnalysis {
  hasCjk: boolean;
  hasRtl: boolean;
  hasLatin: boolean;
  cjkRatio: number;
  rtlRatio: number;
  latinRatio: number;
}

/**
 * RTL text detection result
 */
interface RtlDetection {
  isRtl: boolean;
  rtlRatio: number;
  hasArabic: boolean;
  hasHebrew: boolean;
  detectedScripts: string[];
}

/**
 * Counts characters by script type
 * @param {string} text - Text to analyze
 * @returns {object} Character counts by script type
 */
function countCharactersByScript(text: string): {
  cjkCount: number;
  rtlCount: number;
  latinCount: number;
} {
  let cjkCount = 0;
  let rtlCount = 0;
  let latinCount = 0;

  for (const char of [...text]) {
    const code = char.charCodeAt(0);

    // Check CJK
    const isCjk = CJK_RANGES.some(
      (range) => code >= range.start && code <= range.end
    );
    if (isCjk) cjkCount++;

    // Check RTL (Arabic, Hebrew)
    const isArabic = code >= ARABIC_RANGE.start && code <= ARABIC_RANGE.end;
    const isHebrew = code >= HEBREW_RANGE.start && code <= HEBREW_RANGE.end;
    if (isArabic || isHebrew) rtlCount++;

    // Check Latin
    if (code < LATIN1_CHARACTER_RANGE_MAX) latinCount++;
  }

  return { cjkCount, rtlCount, latinCount };
}

/**
 * Calculates character ratios
 * @param {object} counts - Character counts
 * @param {number} counts.cjkCount - Number of CJK characters
 * @param {number} counts.rtlCount - Number of RTL characters
 * @param {number} counts.latinCount - Number of Latin characters
 * @param {number} totalChars - Total number of characters
 * @returns {object} Character ratios
 */
function calculateCharacterRatios(
  counts: { cjkCount: number; rtlCount: number; latinCount: number },
  totalChars: number
): {
  cjkRatio: number;
  rtlRatio: number;
  latinRatio: number;
} {
  if (totalChars === 0) {
    return { cjkRatio: 0, rtlRatio: 0, latinRatio: 0 };
  }

  return {
    cjkRatio: counts.cjkCount / totalChars,
    rtlRatio: counts.rtlCount / totalChars,
    latinRatio: counts.latinCount / totalChars,
  };
}

/**
 * Checks if a character is in Arabic range
 * @param {number} code - Character code
 * @returns {boolean} True if character is in Arabic range
 */
function isArabic(code: number): boolean {
  return code >= ARABIC_RANGE.start && code <= ARABIC_RANGE.end;
}

/**
 * Checks if a character is in Hebrew range
 * @param {number} code - Character code
 * @returns {boolean} True if character is in Hebrew range
 */
function isHebrew(code: number): boolean {
  return code >= HEBREW_RANGE.start && code <= HEBREW_RANGE.end;
}

/**
 * Detects character script type (CJK, RTL, Latin, etc.)
 * @param {string} text - Text to analyze
 * @returns {CharacterScriptAnalysis} Script analysis results
 */
export function detectCharacterScript(text: string): CharacterScriptAnalysis {
  const totalChars = text.length;
  const counts = countCharactersByScript(text);
  const ratios = calculateCharacterRatios(counts, totalChars);

  return {
    hasCjk: counts.cjkCount > 0,
    hasRtl: counts.rtlCount > 0,
    hasLatin: counts.latinCount > 0,
    cjkRatio: ratios.cjkRatio,
    rtlRatio: ratios.rtlRatio,
    latinRatio: ratios.latinRatio,
  };
}

/**
 * Counts RTL characters by script type
 * @param {string} text - Text to analyze
 * @returns {object} RTL character counts
 */
function countRtlCharacters(text: string): {
  arabicCount: number;
  hebrewCount: number;
} {
  let arabicCount = 0;
  let hebrewCount = 0;

  for (const char of [...text]) {
    const code = char.charCodeAt(0);

    if (isArabic(code)) {
      arabicCount++;
    } else if (isHebrew(code)) {
      hebrewCount++;
    }
  }

  return { arabicCount, hebrewCount };
}

/**
 * Determines detected RTL scripts
 * @param {object} counts - RTL character counts
 * @param {number} counts.arabicCount - Number of Arabic characters
 * @param {number} counts.hebrewCount - Number of Hebrew characters
 * @returns {string[]} Array of detected script names
 */
function getDetectedScripts(counts: {
  arabicCount: number;
  hebrewCount: number;
}): string[] {
  const detectedScripts: string[] = [];

  if (counts.arabicCount > 0) {
    detectedScripts.push('Arabic');
  }
  if (counts.hebrewCount > 0) {
    detectedScripts.push('Hebrew');
  }

  return detectedScripts;
}

/**
 * Detects right-to-left (RTL) text in the input
 * @param {string} text - Text to analyze
 * @returns {RtlDetection} RTL detection results
 */
export function detectRtlText(text: string): RtlDetection {
  const counts = countRtlCharacters(text);
  const totalChars = text.length;

  const rtlRatio =
    totalChars > 0 ? (counts.arabicCount + counts.hebrewCount) / totalChars : 0;
  const isRtl = rtlRatio >= RTL_THRESHOLD;
  const detectedScripts = getDetectedScripts(counts);

  return {
    isRtl,
    rtlRatio,
    hasArabic: counts.arabicCount > 0,
    hasHebrew: counts.hebrewCount > 0,
    detectedScripts,
  };
}

/**
 * Text alignment type
 */
type TextAlignment = 'left' | 'right' | 'center' | 'justify' | 'mixed';

/**
 * Calculates alignment ratio
 * @param {number} alignedCount - Number of aligned lines
 * @param {number} totalLines - Total number of lines
 * @returns {number} Alignment ratio
 */
function calculateAlignmentRatio(
  alignedCount: number,
  totalLines: number
): number {
  if (totalLines === 0) {
    return 0;
  }
  return alignedCount / totalLines;
}

/**
 * Detects text alignment patterns in content
 * @param {string} text - Text to analyze
 * @returns {TextAlignment} Detected text alignment
 */
export function detectTextAlignment(text: string): TextAlignment {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return 'left';
  }

  // Simple heuristic based on indentation patterns
  const leftAlignedCount = lines.filter((line) => !line.startsWith(' ')).length;
  const leftAlignedRatio = calculateAlignmentRatio(
    leftAlignedCount,
    lines.length
  );

  if (leftAlignedRatio > LEFT_ALIGNED_THRESHOLD) {
    return 'left';
  }
  if (leftAlignedRatio < CENTER_ALIGNED_THRESHOLD) {
    return 'center';
  }
  return 'mixed';
}
