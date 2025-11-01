/**
 * Individual element processing utilities for Markdown parser.
 * Contains functions for processing specific element types.
 */

import type { Chapter } from '../types';
import type { ParsedToken } from './parser-core';

// Constants for element processing
const DEFAULT_ELEMENT_RANGE = 100;

/**
 * Extract list items from list token
 *
 * @param {ParsedToken} token - Markdown token containing list information
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
 * Extract text content from nested tokens (helper function)
 *
 * @param {ParsedToken[]} tokens - Array of markdown tokens to extract text from
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

/** Type definitions for chapter elements */
export interface ChapterElements {
  codeBlocks: Array<{
    language?: string;
    code: string;
    position: number;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
    position: number;
  }>;
  lists: Array<{
    ordered: boolean;
    items: string[];
    position: number;
  }>;
  blockquotes: Array<{
    text: string;
    position: number;
  }>;
  links: Array<{
    text: string;
    url: string;
    position: number;
  }>;
  images: Array<{
    alt: string;
    src: string;
    position: number;
  }>;
}

/**
 * Process code token
 *
 * @param {ParsedToken} token - Markdown token containing code information
 * @param {ChapterElements} elements - Elements collection to add code block to
 * @param {number} position - Position of the code token in the document
 */
export function processCodeToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.text) {
    elements.codeBlocks.push({
      language: token.lang,
      code: token.text,
      position,
    });
  }
}

/**
 * Process table token
 *
 * @param {ParsedToken} token - Markdown token containing table information
 * @param {ChapterElements} elements - Elements collection to add table to
 * @param {number} position - Position of the table token in the document
 */
export function processTableToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.header && token.rows) {
    const headers = extractTableHeaders(token);
    const rows = extractTableRows(token);

    elements.tables.push({
      headers,
      rows,
      position,
    });
  }
}

/**
 * Extract table headers from token
 *
 * @param {ParsedToken} token - Markdown token containing table information
 * @returns {string[]} Array of header strings
 */
function extractTableHeaders(token: ParsedToken): string[] {
  if (!token.header || !Array.isArray(token.header)) {
    return [];
  }
  return token.header.map((cell: { text?: string }) => cell?.text || '');
}

/**
 * Extract table rows from token
 *
 * @param {ParsedToken} token - Markdown token containing table information
 * @returns {string[][]} Array of row arrays containing cell strings
 */
function extractTableRows(token: ParsedToken): string[][] {
  if (!token.rows || !Array.isArray(token.rows)) {
    return [];
  }
  return token.rows.map((row: Array<{ text?: string }>) =>
    Array.isArray(row)
      ? row.map((cell: { text?: string }) => cell?.text || '')
      : []
  );
}

/**
 * Process list token
 *
 * @param {ParsedToken} token - Markdown token containing list information
 * @param {ChapterElements} elements - Elements collection to add list to
 * @param {number} position - Position of the list token in the document
 */
export function processListToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.items) {
    const items = extractListItems(token);
    if (items.length > 0) {
      elements.lists.push({
        ordered: Boolean(token.ordered),
        items,
        position,
      });
    }
  }
}

/**
 * Process blockquote token
 *
 * @param {ParsedToken} token - Markdown token containing blockquote information
 * @param {ChapterElements} elements - Elements collection to add blockquote to
 * @param {number} position - Position of the blockquote token in the document
 */
export function processBlockquoteToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.text) {
    elements.blockquotes.push({
      text: token.text,
      position,
    });
  }
}

/**
 * Process link token
 *
 * @param {ParsedToken} token - Markdown token containing link information
 * @param {ChapterElements} elements - Elements collection to add link to
 * @param {number} position - Position of the link token in the document
 */
export function processLinkToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.text && token.href) {
    elements.links.push({
      text: String(token.text),
      url: String(token.href),
      position,
    });
  }
}

/**
 * Process image token
 *
 * @param {ParsedToken} token - Markdown token containing image information
 * @param {ChapterElements} elements - Elements collection to add image to
 * @param {number} position - Position of the image token in the document
 */
export function processImageToken(
  token: ParsedToken,
  elements: ChapterElements,
  position: number
): void {
  if (token.text && token.href) {
    elements.images.push({
      alt: String(token.text),
      src: String(token.href),
      position,
    });
  }
}

/**
 * Create position range for an element
 * @param {number} position - Element start position
 * @returns {{start: number; end: number}} Position range
 */
function createElementPosition(position: number): {
  start: number;
  end: number;
} {
  return {
    start: position,
    end: position + DEFAULT_ELEMENT_RANGE,
  };
}

/**
 * Update chapter with code blocks
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['codeBlocks']} codeBlocks - Code blocks to add
 */
function updateCodeBlocks(
  chapter: Chapter,
  codeBlocks: ChapterElements['codeBlocks']
): void {
  if (codeBlocks.length > 0) {
    chapter.codeBlocks = codeBlocks.map((block) => ({
      type: 'code',
      ...block,
      position: createElementPosition(block.position),
    }));
  }
}

/**
 * Update chapter with tables
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['tables']} tables - Tables to add
 */
function updateTables(
  chapter: Chapter,
  tables: ChapterElements['tables']
): void {
  if (tables.length > 0) {
    chapter.tables = tables.map((table) => ({
      type: 'table',
      ...table,
      position: createElementPosition(table.position),
    }));
  }
}

/**
 * Update chapter with lists
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['lists']} lists - Lists to add
 */
function updateLists(chapter: Chapter, lists: ChapterElements['lists']): void {
  if (lists.length > 0) {
    chapter.lists = lists.map((list) => ({
      type: 'list',
      ...list,
      position: createElementPosition(list.position),
    }));
  }
}

/**
 * Update chapter with blockquotes
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['blockquotes']} blockquotes - Blockquotes to add
 */
function updateBlockquotes(
  chapter: Chapter,
  blockquotes: ChapterElements['blockquotes']
): void {
  if (blockquotes.length > 0) {
    chapter.blockquotes = blockquotes.map((quote) => ({
      type: 'blockquote',
      ...quote,
      position: createElementPosition(quote.position),
    }));
  }
}

/**
 * Update chapter with links
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['links']} links - Links to add
 */
function updateLinks(chapter: Chapter, links: ChapterElements['links']): void {
  if (links.length > 0) {
    chapter.links = links.map((link) => ({
      type: 'link',
      ...link,
      position: createElementPosition(link.position),
    }));
  }
}

/**
 * Update chapter with images
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements['images']} images - Images to add
 */
function updateImages(
  chapter: Chapter,
  images: ChapterElements['images']
): void {
  if (images.length > 0) {
    chapter.images = images.map((image) => ({
      type: 'image',
      ...image,
      position: createElementPosition(image.position),
    }));
  }
}

/**
 * Update chapter with extracted elements
 *
 * @param {Chapter} chapter - Chapter to update
 * @param {ChapterElements} elements - Elements to add to chapter
 */
export function updateChapterWithElements(
  chapter: Chapter,
  elements: ChapterElements
): void {
  updateCodeBlocks(chapter, elements.codeBlocks);
  updateTables(chapter, elements.tables);
  updateLists(chapter, elements.lists);
  updateBlockquotes(chapter, elements.blockquotes);
  updateLinks(chapter, elements.links);
  updateImages(chapter, elements.images);
}

/**
 * Initialize empty chapter elements collection
 *
 * @returns {ChapterElements} Empty chapter elements object
 */
export function initializeChapterElements(): ChapterElements {
  return {
    codeBlocks: [],
    tables: [],
    lists: [],
    blockquotes: [],
    links: [],
    images: [],
  };
}
