/**
 * Element extraction utilities for Markdown parser.
 * Handles extraction of special elements like code blocks and tables.
 */

import type { Chapter, MarkdownElement } from '../types';
import {
  processCodeToken,
  processTableToken,
  processListToken,
  processBlockquoteToken,
  processLinkToken,
  processImageToken,
  updateChapterWithElements,
  initializeChapterElements,
  type ChapterElements,
} from './element-processors';
import type { ParsedToken } from './parser-core';

// Type definitions for table structure
interface TableCell {
  text?: string;
  [key: string]: unknown;
}

interface TableRow {
  [key: string]: unknown;
}

/**
 * Extract special elements (code blocks, tables, etc.) from tokens
 * @param {ParsedToken[]} tokens - Array of markdown tokens to process
 * @returns {MarkdownElement[]} Array of extracted MarkdownElement objects
 */
export function extractElements(tokens: ParsedToken[]): MarkdownElement[] {
  const elements: MarkdownElement[] = [];
  let currentPosition = 0;

  for (const token of tokens) {
    const element = extractElementFromToken(token, currentPosition);
    if (element) {
      elements.push(element);
    }

    // Update position based on token content length
    currentPosition += (token.raw || '').length;
  }

  return elements;
}

/**
 * Extract a single element from a token if it's a special element type
 * @param {ParsedToken} token - Token to extract element from
 * @param {number} position - Position of the token in the document
 * @returns {MarkdownElement | null} MarkdownElement object or null if token is not a special element
 */
export function extractElementFromToken(
  token: ParsedToken,
  position: number
): MarkdownElement | null {
  switch (token.type) {
    case 'code':
      return extractCodeBlockElement(token, position);
    case 'table':
      return extractTableElement(token, position);
    case 'blockquote':
      return extractBlockquoteElement(token, position);
    case 'list':
      return extractListElement(token, position);
    case 'image':
      return extractImageElement(token, position);
    case 'link':
      return extractLinkElement(token, position);
    default:
      return null;
  }
}

/**
 * Extract code block element from token
 * @param {ParsedToken} token - Token containing code block information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} Code block MarkdownElement object
 */
export function extractCodeBlockElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const code = token.text || '';
  const language = token.lang;

  return {
    type: 'code',
    raw: rawContent,
    content: code,
    attributes: {
      language: language || 'text',
    },
  };
}

/**
 * Extract headers from table token
 * @param {ParsedToken} token - Table token containing header information
 * @returns {string[]} Array of header strings
 */
function extractTableHeaders(token: ParsedToken): string[] {
  if (!token.header || !Array.isArray(token.header)) {
    return [];
  }
  return token.header.map((cell: TableCell) => cell?.text || '');
}

/**
 * Extract rows from table token
 * @param {ParsedToken} token - Table token containing row information
 * @returns {string[][]} Array of row arrays containing cell strings
 */
function extractTableRows(token: ParsedToken): string[][] {
  if (!token.rows || !Array.isArray(token.rows)) {
    return [];
  }
  return token.rows.map((row: TableRow) =>
    Array.isArray(row) ? row.map((cell: TableCell) => cell?.text || '') : []
  );
}

/**
 * Create table metadata
 * @param {string[]} headers - Table headers array
 * @param {string[][]} rows - Table rows array
 * @returns {Record<string, unknown>} Table metadata object
 */
function createTableMetadata(
  headers: string[],
  rows: string[][]
): Record<string, unknown> {
  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
}

/**
 * Extract table element from token
 * @param {ParsedToken} token - Table token containing table information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} Table MarkdownElement object
 */
export function extractTableElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const headers = extractTableHeaders(token);
  const rows = extractTableRows(token);

  return {
    type: 'table',
    raw: rawContent,
    content: rawContent,
    attributes: createTableMetadata(headers, rows),
  };
}

/**
 * Extract blockquote element from token
 * @param {ParsedToken} token - Blockquote token containing blockquote information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} Blockquote MarkdownElement object
 */
export function extractBlockquoteElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const text = token.text || '';

  return {
    type: 'quote',
    raw: rawContent,
    content: text,
  };
}

/**
 * Extract list items from list token
 * @param {ParsedToken} token - List token containing list items
 * @returns {string[]} Array of item strings
 */
function extractListItems(token: ParsedToken): string[] {
  if (!token.items || !Array.isArray(token.items)) {
    return [];
  }

  const items: string[] = [];
  for (const item of token.items) {
    const itemText = extractTextFromTokens(
      (item.tokens || []) as ParsedToken[]
    );
    if (itemText) {
      items.push(itemText);
    }
  }
  return items;
}

/**
 * Create list metadata
 * @param {boolean} isOrdered - Whether the list is ordered or unordered
 * @param {string[]} items - Array of list item strings
 * @returns {Record<string, unknown>} List metadata object
 */
function createListMetadata(
  isOrdered: boolean,
  items: string[]
): Record<string, unknown> {
  return {
    ordered: isOrdered,
    items,
    itemCount: items.length,
  };
}

/**
 * Extract list element from token
 * @param {ParsedToken} token - List token containing list information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} List MarkdownElement object
 */
export function extractListElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const items = extractListItems(token);
  const isOrdered = Boolean(token.ordered);

  return {
    type: 'list',
    raw: rawContent,
    content: items.join('\n'),
    attributes: createListMetadata(isOrdered, items),
  };
}

/**
 * Extract image element from token
 * @param {ParsedToken} token - Image token containing image information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} Image MarkdownElement object
 */
export function extractImageElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const href = token.href || '';
  const title = token.title || '';
  const text = token.text || '';

  return {
    type: 'image',
    raw: rawContent,
    content: text,
    attributes: {
      src: href,
      alt: text,
      title,
    },
  };
}

/**
 * Extract link element from token
 * @param {ParsedToken} token - Link token containing link information
 * @param {number} _position - Position of the token in the document
 * @returns {MarkdownElement} Link MarkdownElement object
 */
export function extractLinkElement(
  token: ParsedToken,
  _position: number
): MarkdownElement {
  const rawContent = token.raw || '';
  const href = token.href || '';
  const title = token.title || '';
  const text = token.text || '';

  return {
    type: 'link',
    raw: rawContent,
    content: text,
    attributes: {
      url: href,
      text,
      title,
    },
  };
}

/**
 * Extract text content from nested tokens (helper function)
 * @param {ParsedToken[]} tokens - Array of tokens to extract text from
 * @returns {string} Concatenated text content
 */
function extractTextFromTokens(tokens: ParsedToken[]): string {
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

/**
 * Process a single token and add to elements collection
 *
 * @param {ParsedToken} token - Token to process for elements
 * @param {ChapterElements} elements - Elements collection to populate
 */
function processTokenForElements(
  token: ParsedToken,
  elements: ChapterElements
): void {
  const position = (token.position as number) || 0;

  switch (token.type) {
    case 'code':
      processCodeToken(token, elements, position);
      break;
    case 'table':
      processTableToken(token, elements, position);
      break;
    case 'list':
      processListToken(token, elements, position);
      break;
    case 'blockquote':
      processBlockquoteToken(token, elements, position);
      break;
    case 'link':
      processLinkToken(token, elements, position);
      break;
    case 'image':
      processImageToken(token, elements, position);
      break;
  }
}

/**
 * Extract and populate special elements in a chapter
 *
 * @param {Chapter} chapter - The chapter to populate with elements
 * @param {ParsedToken[]} tokens - Array of tokens to extract elements from
 */
export function extractChapterElements(
  chapter: Chapter,
  tokens: ParsedToken[]
): void {
  const elements = initializeChapterElements();

  for (const token of tokens) {
    processTokenForElements(token, elements);
  }

  updateChapterWithElements(chapter, elements);
}
