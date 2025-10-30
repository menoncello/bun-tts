/**
 * Token processing utilities for Markdown parser.
 * Handles tokenization and conversion operations.
 */

import { marked, type Token } from 'marked';
import { MarkdownParseError } from '../errors/markdown-parse-error.js';

export interface ParsedToken {
  type: string;
  text: string;
  raw: string;
  depth?: number;
  items?: ParsedToken[];
  lang?: string;
  [key: string]: unknown;
}

/**
 * Check if a line is a heading
 * @param {string} line - The line to check
 * @returns {boolean} True if the line is a heading
 */
const isHeading = (line: string): boolean => {
  return line.match(/^#{1,6}\s/) !== null;
};

/**
 * Handle code block boundaries
 * @param {string} line - The current line being processed
 * @param {boolean} inCodeBlock - Whether we're currently in a code block
 * @param {string[]} resultLines - Array to push processed lines to
 * @returns {boolean} Updated inCodeBlock status
 */
const handleCodeBlockBoundary = (
  line: string,
  inCodeBlock: boolean,
  resultLines: string[]
): boolean => {
  if (line.startsWith('```')) {
    resultLines.push(line);
    return !inCodeBlock; // Toggle code block status
  }
  return inCodeBlock;
};

/**
 * Handle heading inside code block
 * @param {string} line - The current line being processed
 * @param {string[]} resultLines - Array to push processed lines to
 * @returns {boolean} True if a heading was found inside a code block
 */
const handleHeadingInCodeBlock = (
  line: string,
  resultLines: string[]
): boolean => {
  if (isHeading(line)) {
    resultLines.push('```');
    resultLines.push(line);
    return true;
  }
  return false;
};

/**
 * Process a single line of markdown
 * @param {string} line - The line to process
 * @param {boolean} inCodeBlock - Whether we're currently in a code block
 * @param {string[]} resultLines - Array to push processed lines to
 * @returns {boolean} Updated inCodeBlock status
 */
const processLine = (
  line: string,
  inCodeBlock: boolean,
  resultLines: string[]
): boolean => {
  if (!line) {
    resultLines.push('');
    return inCodeBlock;
  }

  const newInCodeBlock = handleCodeBlockBoundary(
    line,
    inCodeBlock,
    resultLines
  );
  if (newInCodeBlock !== inCodeBlock) {
    return newInCodeBlock;
  }

  if (inCodeBlock && handleHeadingInCodeBlock(line, resultLines)) {
    return false; // Heading in code block closes the code block
  }

  resultLines.push(line);
  return inCodeBlock;
};

/**
 * Close any remaining open code block
 * @param {boolean} inCodeBlock - Whether there's an open code block
 * @param {string[]} resultLines - Array to push closing code block to
 */
const closeOpenCodeBlock = (
  inCodeBlock: boolean,
  resultLines: string[]
): void => {
  if (inCodeBlock) {
    resultLines.push('```');
  }
};

/**
 * Preprocess malformed markdown to make it more recoverable
 * @param {string} content - The raw markdown content to preprocess
 * @returns {string} Preprocessed markdown content
 */
const preprocessMalformedMarkdown = (content: string): string => {
  const lines = content.split('\n');
  const resultLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    inCodeBlock = processLine(line, inCodeBlock, resultLines);
  }

  closeOpenCodeBlock(inCodeBlock, resultLines);

  return resultLines.join('\n');
};

/**
 * Tokenize markdown content
 * @param {string} content - The markdown content to tokenize
 * @returns {ParsedToken[] | MarkdownParseError} Array of parsed tokens or a MarkdownParseError if tokenization fails
 */
export const tokenizeMarkdown = (
  content: string
): ParsedToken[] | MarkdownParseError => {
  try {
    const preprocessedContent = preprocessMalformedMarkdown(content);
    const tokens = marked.lexer(preprocessedContent);
    return convertTokens(tokens);
  } catch (error) {
    return MarkdownParseError.parseFailed(
      'Tokenization failed',
      error as Error
    );
  }
};

/**
 * Convert a single marked Token to ParsedToken format
 * @param {Token} token - The marked library token to convert
 * @returns {ParsedToken} Converted ParsedToken object
 */
const convertSingleToken = (token: Token): ParsedToken => {
  const parsedToken: ParsedToken = {
    type: token.type,
    text: 'text' in token ? token.text : '',
    raw: 'raw' in token ? token.raw : '',
    depth: 'depth' in token ? token.depth : undefined,
    lang: 'lang' in token ? token.lang : undefined,
  };

  // Handle items for list tokens
  if ('items' in token && token.items && Array.isArray(token.items)) {
    parsedToken.items = convertTokens(token.items as Token[]);
  }

  // Preserve other properties
  preserveAdditionalProperties(token, parsedToken);

  return parsedToken;
};

/**
 * Preserve additional properties from token to parsedToken
 * @param {Token} token - The source token
 * @param {ParsedToken} parsedToken - The target parsed token
 */
const preserveAdditionalProperties = (
  token: Token,
  parsedToken: ParsedToken
): void => {
  const excludedKeys = ['type', 'text', 'raw', 'depth', 'lang', 'items'];

  for (const key of Object.keys(token)) {
    if (!excludedKeys.includes(key)) {
      (parsedToken as Record<string, unknown>)[key] = (
        token as Record<string, unknown>
      )[key];
    }
  }
};

/**
 * Convert marked Tokens to ParsedToken format
 * @param {Token[]} tokens - The marked library tokens to convert
 * @returns {ParsedToken[]} Array of converted ParsedToken objects
 */
const convertTokens = (tokens: Token[]): ParsedToken[] => {
  return tokens.map(convertSingleToken);
};
