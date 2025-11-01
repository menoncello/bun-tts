/**
 * Markdown parsing and element types for document processing.
 * Provides interfaces for structured markdown content representation.
 */

/**
 * Extracted markdown element interface
 */
export interface MarkdownElement {
  /** Element type (code, table, list, blockquote, link, image) */
  type: string;
  /** Element content or text */
  content?: string;
  /** Element position in document */
  position?: {
    start: number;
    end: number;
  };
  /** Additional element-specific properties */
  [key: string]: unknown;
}

/**
 * Token interface for parsed Markdown elements
 */
export interface ParsedToken {
  type: string;
  text: string;
  raw: string;
  depth?: number;
  items?: ParsedToken[];
  lang?: string;
  [key: string]: unknown;
}
