/**
 * Document metadata extraction utilities for Markdown parser.
 * Handles extraction of title, author, dates, and other metadata from content.
 */

import type { DocumentMetadata } from '../types';
import type { ParsedToken } from './parser-core';
import { countWords } from './text-processing-utils';

/** Constants for document processing */
const DEFAULT_DOCUMENT_TITLE = 'Untitled Document';
const MAX_METADATA_LINES = 20;
const CONSECUTIVE_PARAGRAPH_THRESHOLD = 2;
const FIRST_HEADING_DEPTH = 1;

/** Regex patterns for metadata extraction */
const METADATA_PATTERNS = {
  author: /^author: *([^\t ].*)$/i,
  authorAlt: /^by: *([^\t ].*)$/i,
  date: /^date: *([^\t ].*)$/i,
  created: /^created: *([^\t ].*)$/i,
  modified: /^modified: *([^\t ].*)$/i,
  updated: /^updated: *([^\t ].*)$/i,
  language: /^language: *([^\t ].*)$/i,
  lang: /^lang: *([^\t ].*)$/i,
} as const;

/** Interface for metadata extraction result */
interface DocumentMetadataFields {
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
  language?: string;
}

/**
 * Extract title from tokens
 * @param {ParsedToken[]} tokens - Array of parsed tokens to search for title
 * @returns {string} Extracted title or default title
 */
export const extractTitleFromTokens = (tokens: ParsedToken[]): string => {
  for (const token of tokens) {
    if (
      token.type === 'heading' &&
      token.depth === FIRST_HEADING_DEPTH &&
      token.text
    ) {
      return token.text;
    }
  }
  return DEFAULT_DOCUMENT_TITLE;
};

/**
 * Check if a line matches any metadata pattern
 * @param {string} line - Line to check for metadata patterns
 * @returns {boolean} True if the line is a metadata line
 */
export const isMetadataLine = (line: string): boolean => {
  return Object.values(METADATA_PATTERNS).some((pattern) => pattern.test(line));
};

/**
 * Check if a line is a markdown formatting element
 * @param {string} line - Line to check for markdown formatting
 * @returns {boolean} True if the line is a formatting element
 */
export const isFormattingElement = (line: string): boolean => {
  return (
    line.startsWith('#') ||
    line.startsWith('```') ||
    line.startsWith('|') ||
    line.startsWith('-') ||
    line.startsWith('*')
  );
};

/**
 * Extract author metadata from a line
 * @param {string} line - Line to extract author information from
 * @returns {string | null} Extracted author value or null if not found
 */
export const extractAuthorFromLine = (line: string): string | null => {
  const authorMatch =
    METADATA_PATTERNS.author.exec(line) ||
    METADATA_PATTERNS.authorAlt.exec(line);
  return authorMatch?.[1]?.trim() ?? null;
};

/**
 * Extract date metadata from a line
 * @param {string} line - Line to extract date information from
 * @returns {string | null} Extracted date value or null if not found
 */
export const extractDateFromLine = (line: string): string | null => {
  const dateMatch =
    METADATA_PATTERNS.date.exec(line) || METADATA_PATTERNS.created.exec(line);
  return dateMatch?.[1]?.trim() ?? null;
};

/**
 * Extract modified date metadata from a line
 * @param {string} line - Line to extract modified date information from
 * @returns {string | null} Extracted modified date value or null if not found
 */
export const extractModifiedDateFromLine = (line: string): string | null => {
  const modifiedMatch =
    METADATA_PATTERNS.modified.exec(line) ||
    METADATA_PATTERNS.updated.exec(line);
  return modifiedMatch?.[1]?.trim() ?? null;
};

/**
 * Extract language metadata from a line
 * @param {string} line - Line to extract language information from
 * @returns {string | null} Extracted language value or null if not found
 */
export const extractLanguageFromLine = (line: string): string | null => {
  const languageMatch =
    METADATA_PATTERNS.language.exec(line) || METADATA_PATTERNS.lang.exec(line);
  return languageMatch?.[1]?.trim() ?? null;
};

/**
 * Extract metadata value from a line using the appropriate pattern
 * @param {string} line - Line to extract metadata from
 * @param {DocumentMetadataFields} metadata - Metadata object to populate with extracted values
 * @returns {void}
 */
export const extractMetadataFromLine = (
  line: string,
  metadata: DocumentMetadataFields
): void => {
  const author = extractAuthorFromLine(line);
  if (author) {
    metadata.author = author;
    return;
  }

  const date = extractDateFromLine(line);
  if (date) {
    metadata.createdDate = date;
    return;
  }

  const modifiedDate = extractModifiedDateFromLine(line);
  if (modifiedDate) {
    metadata.modifiedDate = modifiedDate;
    return;
  }

  const language = extractLanguageFromLine(line);
  if (language) {
    metadata.language = language;
  }
};

/**
 * Check if we should stop processing metadata
 * @param {boolean} contentStarted - Whether content processing has started
 * @param {number} lineIndex - Current line index being processed
 * @returns {boolean} True if we should stop processing
 */
export const shouldStopProcessing = (
  contentStarted: boolean,
  lineIndex: number
): boolean => {
  return contentStarted && lineIndex > MAX_METADATA_LINES;
};

/**
 * Process a single line during metadata extraction
 * @param {string} line - Line to process for metadata
 * @param {{ value: boolean }} contentStartedRef - Reference object tracking if content has started
 * @param {boolean} contentStartedRef.value - Current content started state
 * @param {{ value: number }} consecutiveParagraphLinesRef - Reference object tracking consecutive paragraph lines
 * @param {number} consecutiveParagraphLinesRef.value - Current consecutive paragraph count
 * @param {DocumentMetadataFields} metadata - Metadata object to populate with extracted values
 * @returns {void}
 */
export const processMetadataLine = (
  line: string,
  contentStartedRef: { value: boolean },
  consecutiveParagraphLinesRef: { value: number },
  metadata: DocumentMetadataFields
): void => {
  if (isMetadataLine(line)) {
    extractMetadataFromLine(line, metadata);
    return;
  }

  if (isFormattingElement(line)) {
    consecutiveParagraphLinesRef.value = 0;
    return;
  }

  consecutiveParagraphLinesRef.value++;
  if (consecutiveParagraphLinesRef.value >= CONSECUTIVE_PARAGRAPH_THRESHOLD) {
    contentStartedRef.value = true;
  }
};

/**
 * Extract metadata from markdown content using key-value patterns
 * @param {string} content - Markdown content to extract metadata from
 * @returns {DocumentMetadataFields} Extracted metadata (author, createdDate, etc.)
 */
export const extractMetadataFromContent = (
  content: string
): DocumentMetadataFields => {
  const metadata: DocumentMetadataFields = {};
  const lines = content.split('\n');

  const contentStartedRef = { value: false };
  const consecutiveParagraphLinesRef = { value: 0 };

  for (const [lineIndex, rawLine] of lines.entries()) {
    const line = rawLine?.trim();
    if (!line) continue;

    if (shouldStopProcessing(contentStartedRef.value, lineIndex)) {
      break;
    }

    processMetadataLine(
      line,
      contentStartedRef,
      consecutiveParagraphLinesRef,
      metadata
    );
  }

  return metadata;
};

/**
 * Extract metadata from content and tokens
 * @param {string} content - Markdown content to extract metadata from
 * @param {ParsedToken[]} tokens - Array of parsed tokens to extract title from
 * @returns {DocumentMetadata} Document metadata object
 */
export const extractMetadata = (
  content: string,
  tokens: ParsedToken[]
): DocumentMetadata => {
  // Extract title from first h1
  const title = extractTitleFromTokens(tokens);

  // Extract additional metadata from content
  const metadata = extractMetadataFromContent(content);

  // Calculate word count
  const wordCount = countWords(content);

  return {
    title,
    ...metadata,
    wordCount,
    characterCount: content.length,
    customMetadata: {},
    createdDate: metadata.createdDate
      ? new Date(metadata.createdDate)
      : undefined,
    modifiedDate: metadata.modifiedDate
      ? new Date(metadata.modifiedDate)
      : undefined,
  };
};
