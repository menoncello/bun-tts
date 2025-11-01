/**
 * EPUB-specific types and embedded asset definitions.
 * Provides interfaces for EPUB document structure and embedded content.
 */

/**
 * Embedded assets in EPUB documents
 */
export interface EmbeddedAssets {
  images: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  styles: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  fonts: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  other: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  audio: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  video: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
}

/**
 * Table of contents item for navigation structure
 */
export interface TableOfContentsItem {
  id: string;
  title: string;
  href: string;
  level: number;
  children: TableOfContentsItem[];
}

/**
 * Document statistics for content analysis
 */
export interface DocumentStatistics {
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
  estimatedReadingTime: number;
  chapterCount: number;
  imageCount: number;
  tableCount: number;
}

/**
 * Paragraph match with sentence positioning information
 */
export interface ParagraphMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
}
