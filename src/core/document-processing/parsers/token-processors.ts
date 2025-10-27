/**
 * Token processing utilities for Markdown parsing
 */

import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import type { Paragraph } from '../types.js';
import { PARSER_CONSTANTS } from './constants.js';
import type { ParsedToken } from './parser-core.js';
import {
  extractSentences,
  calculateParagraphConfidence,
  countWords,
} from './text-processing-utils.js';

/**
 * Extract paragraph from token
 * @param token - The parsed token to extract paragraph content from
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for paragraph extraction
 * @returns A paragraph object or null if token type is not supported
 */
export function extractParagraphFromToken(
  token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph | null {
  switch (token.type) {
    case 'paragraph':
      return extractTextParagraph(token, position, config);
    case 'code':
      return extractCodeParagraph(token, position, config);
    case 'blockquote':
      return extractBlockquoteParagraph(token, position, config);
    case 'list':
      return extractListParagraph(token, position, config);
    case 'table':
      return extractTableParagraph(token, position, config);
    default:
      return null;
  }
}

/**
 * Extract text paragraph from token
 * @param token - The parsed token of type 'paragraph' to extract content from
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for sentence extraction
 * @returns A paragraph object containing extracted sentences and metadata
 */
export function extractTextParagraph(
  token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph {
  const text = token.text || '';
  const sentences = extractSentences(
    text,
    config.minSentenceLength,
    config.sentenceBoundaryPatterns
  );

  return {
    id: `paragraph-${position}`,
    type: 'text',
    sentences,
    position,
    wordCount: countWords(text),
    rawText: text,
    includeInAudio: true,
    confidence: calculateParagraphConfidence(sentences),
  };
}

/**
 * Extract code paragraph from token
 * @param token - The parsed token of type 'code' to extract content from
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for code block inclusion
 * @returns A paragraph object representing a code block
 */
export function extractCodeParagraph(
  token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph {
  const text = token.text || '';

  return {
    id: `paragraph-${position}`,
    type: 'code',
    sentences: [], // Code blocks don't have sentences for TTS
    position,
    wordCount: 0,
    rawText: text,
    includeInAudio: config.includeCodeBlocks,
    confidence: PARSER_CONSTANTS.MAX_CONFIDENCE, // Code is always confidently identified
  };
}

/**
 * Extract blockquote paragraph from token
 * @param token - The parsed token of type 'blockquote' to extract content from
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for blockquote inclusion
 * @returns A paragraph object representing a blockquote
 */
export function extractBlockquoteParagraph(
  token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph {
  const text = token.text || '';
  const sentences = extractSentences(
    text,
    config.minSentenceLength,
    config.sentenceBoundaryPatterns
  );

  return {
    id: `paragraph-${position}`,
    type: 'blockquote',
    sentences,
    position,
    wordCount: countWords(text),
    rawText: text,
    includeInAudio: config.includeBlockquotes,
    confidence: calculateParagraphConfidence(sentences),
  };
}

/**
 * Extract list paragraph from token
 * @param token - The parsed token of type 'list' to extract content from
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for list inclusion
 * @returns A paragraph object representing a list
 */
export function extractListParagraph(
  token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph {
  const listText = extractListText(token);
  const sentences = extractSentences(
    listText,
    config.minSentenceLength,
    config.sentenceBoundaryPatterns
  );

  return {
    id: `paragraph-${position}`,
    type: 'list',
    sentences,
    position,
    wordCount: countWords(listText),
    rawText: listText,
    includeInAudio: config.includeLists,
    confidence: calculateParagraphConfidence(sentences),
  };
}

/**
 * Extract table paragraph from token
 * @param _token - The parsed token of type 'table' (parameter prefixed with _ to indicate unused)
 * @param position - The position index of the paragraph in the document
 * @param config - Configuration settings for table inclusion
 * @returns A paragraph object representing a table
 */
export function extractTableParagraph(
  _token: ParsedToken,
  position: number,
  config: MarkdownParserConfig
): Paragraph {
  return {
    id: `paragraph-${position}`,
    type: 'table',
    sentences: [], // Tables are handled specially for TTS
    position,
    wordCount: 0,
    rawText: PARSER_CONSTANTS.TABLE_PLACEHOLDER,
    includeInAudio: config.includeTables,
    confidence: PARSER_CONSTANTS.MAX_CONFIDENCE, // Tables are always confidently identified
  };
}

/**
 * Extract text content from list token
 * @param token - The parsed token of type 'list' to extract text from
 * @returns Concatenated text content from all list items
 */
export function extractListText(token: ParsedToken): string {
  const items: string[] = [];

  if (token.items) {
    for (const item of token.items) {
      const itemText = extractTextFromTokens(
        (item.tokens || []) as ParsedToken[]
      );
      if (itemText) {
        items.push(itemText);
      }
    }
  }

  return items.join(' ');
}

/**
 * Extract text from nested tokens
 * @param tokens - Array of parsed tokens to extract text content from
 * @returns Concatenated text content from all tokens
 */
export function extractTextFromTokens(tokens: ParsedToken[]): string {
  const textParts: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
      case 'codespan':
        textParts.push(token.text || '');
        break;
      case 'strong':
      case 'em':
        if (token.tokens) {
          textParts.push(extractTextFromTokens(token.tokens as ParsedToken[]));
        }
        break;
      default:
        // Handle other token types as needed
        break;
    }
  }

  return textParts.join('');
}
