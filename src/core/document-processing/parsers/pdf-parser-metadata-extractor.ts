/**
 * PDF metadata extraction utilities.
 * Handles extraction of document metadata from PDF text content.
 */

import type { DocumentMetadata } from '../types.js';
import { PARSER_CONSTANTS } from './constants.js';
import { countWords } from './text-processing-utils.js';

// Constants for magic numbers
const TITLE_CANDIDATE_LINES = 5;
const MIN_TITLE_LENGTH = 3;
const MIN_LINE_LENGTH = 10;
const MAX_TITLE_LENGTH = 100;

/**
 * Checks if a line looks like a chapter header
 * @param {string} line - Text line to check
 * @returns {boolean} True if line appears to be a chapter header
 */
export function isChapterHeader(line: string): boolean {
  const patterns = [
    /^chapter\s+\d+/i, // "Chapter 1", "Chapter 2"
    /^chapter\s+[cdilmvx]+$/i, // "Chapter I", "Chapter II"
    /^\d+\./, // "1.", "2."
    /^\d+\s+[A-Z][\sA-Z]*$/, // "1 INTRODUCTION", "2 METHODS"
    /^[A-Z][\sA-Z]*\d*$/, // "INTRODUCTION", "APPENDIX A"
    /^#\s+/, // Markdown style "# Title"
    /^##\s+/, // Markdown style "## Title"
  ];

  return patterns.some((pattern) => pattern.test(line));
}

/**
 * Clean chapter title by removing formatting
 * @param {string} title - Raw chapter title
 * @returns {string} Cleaned chapter title
 */
export function _cleanChapterTitle(title: string): string {
  return title
    .replace(/^#+\s*/, '') // Remove markdown headers
    .replace(/^\d+\.\s*/, '') // Remove numbered prefixes
    .replace(/^chapter\s+\d+/i, '') // Remove chapter prefixes
    .replace(/^chapter\s+[cdilmvx]+$/i, '') // Remove roman numeral chapters
    .trim();
}

/**
 * Extract title from text lines
 * @param {string[]} lines - Array of text lines
 * @returns {string | null} Extracted title or null if not found
 */
export function extractTitleFromText(lines: string[]): string | null {
  // Look for title in first few lines
  const titleCandidates = lines.slice(0, TITLE_CANDIDATE_LINES);

  for (const line of titleCandidates) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip if it looks like a chapter header
    if (isChapterHeader(trimmed)) continue;

    // Skip if it's too short or too long
    if (trimmed.length < MIN_TITLE_LENGTH || trimmed.length > MAX_TITLE_LENGTH)
      continue;

    // Skip if it's all numbers or contains page numbers
    if (/^\d+$/.test(trimmed) || /\b(page|p)\s*\d+/i.test(trimmed)) continue;

    // Skip if it's all uppercase (likely a header)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > MIN_LINE_LENGTH)
      continue;

    // This looks like a good title candidate
    return trimmed;
  }

  return null;
}

/**
 * Extract basic metadata from PDF text
 * @param {string} text - Raw text content
 * @returns {DocumentMetadata} Basic document metadata
 */
export function extractBasicMetadataFromPDF(text: string): DocumentMetadata {
  const lines = text.split('\n');
  const title = extractTitleFromText(lines) || 'PDF Document';
  const totalWords = countWords(text);
  const estimatedDuration = Math.ceil(
    totalWords / PARSER_CONSTANTS.WORDS_PER_MINUTE
  );

  return {
    title,
    wordCount: totalWords,
    totalWords,
    estimatedReadingTime: estimatedDuration,
    chapterCount: 0, // Will be calculated during full processing
    customMetadata: {},
  };
}
