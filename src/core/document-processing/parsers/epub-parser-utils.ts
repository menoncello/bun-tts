/**
 * EPUB Parser Utilities
 *
 * Utility functions and constants for EPUB parsing
 */

// Constants
export const DEFAULT_READING_SPEED = 200; // words per minute
export const MILLISECONDS_PER_SECOND = 1000;
export const EPUB_LIBRARY_VERSION = '0.1.9';
export const EPUB_LIBRARY_FEATURES = ['epub2', 'epub3', 'ncx', 'nav', 'opf'];
export const DEFAULT_MIME_TYPE = 'application/octet-stream';
export const DEFAULT_TITLE = 'Unknown Title';
export const DEFAULT_AUTHOR = 'Unknown Author';
export const DEFAULT_PUBLISHER = 'Unknown Publisher';
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_VERSION = '3.0';
export const ERROR_MESSAGE_NO_CONTENT = 'No content found for chapter:';

/**
 * Strip HTML tags and clean up content
 * @param content - Content with HTML tags
 * @returns Cleaned text content
 */
export function stripHTMLAndClean(content: string): string {
  return content
    .replace(/<script[^>]*>[\S\s]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\S\s]*?<\/style>/gi, '')
    .replace(/<[^>]{1,200}>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Count words in text content
 * @param text - Text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract paragraph matches from content using line-by-line processing
 * @param content - Text content to extract paragraphs from
 * @returns Array of paragraph text matches
 */
export function extractParagraphMatches(content: string): string[] {
  const matches: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim().length > 0) {
      matches.push(line);
    }
  }

  return matches;
}

/**
 * Extract sentence matches from text using safer regex
 * @param text - Text to extract sentences from
 * @returns Array of sentence regex matches
 */
export function extractSentenceMatches(text: string): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  // Using a safer regex pattern to avoid backtracking issues
  // Limiting repetition to prevent exponential backtracking
  const sentenceRegex = /[!.?]{1,3}\s+/g;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    matches.push(match);
  }

  return matches;
}

/**
 * Extract sentence text from full text based on match
 * @param text - Full text
 * @param lastIndex - Last match end position
 * @param match - Current match
 * @returns Sentence text
 */
export function extractSentenceText(
  text: string,
  lastIndex: number,
  match: RegExpExecArray
): string {
  return text.substring(lastIndex, match.index + match[0].length).trim();
}

/**
 * Create sentence object with positions
 * @param sentenceText - Sentence text
 * @param startIndex - Global start index
 * @param lastIndex - Last match end position
 * @param match - Current match
 * @returns Sentence object
 */
export function createSentenceObject(
  sentenceText: string,
  startIndex: number,
  lastIndex: number,
  match: RegExpExecArray
): { text: string; startIndex: number; endIndex: number } {
  return {
    text: sentenceText,
    startIndex: startIndex + lastIndex,
    endIndex: startIndex + match.index + match[0].length,
  };
}

/**
 * Add remaining text as final sentence if any exists
 * @param text - Full text
 * @param startIndex - Global start index
 * @param lastIndex - Last match end position
 * @param sentences - Array to add sentence to
 */
export function addRemainingTextAsSentence(
  text: string,
  startIndex: number,
  lastIndex: number,
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>
): void {
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText.length > 0) {
      sentences.push({
        text: remainingText,
        startIndex: startIndex + lastIndex,
        endIndex: startIndex + text.length,
      });
    }
  }
}

/**
 * Create asset object from manifest item
 * @param item - Manifest item
 * @param item.href - The href path of the asset
 * @param item.mediaType - The media type of the asset
 * @returns Asset object
 */
export function createAssetFromManifestItem(item: {
  href: string;
  mediaType?: string;
}): {
  href: string;
  mediaType: string;
  size: number;
} {
  return {
    href: item.href,
    mediaType: item.mediaType || DEFAULT_MIME_TYPE,
    size: 0,
  };
}

/**
 * Add asset to correct category based on media type
 * @param asset - Asset to categorize
 * @param asset.href - The href path of the asset
 * @param asset.mediaType - The media type of the asset
 * @param asset.size - The size of the asset
 * @param assets - Assets object to add to
 * @param assets.images - Array to store image assets
 * @param assets.audio - Array to store audio assets
 * @param assets.video - Array to store video assets
 * @param assets.fonts - Array to store font assets
 * @param assets.other - Array to store other assets
 */
export function addAssetToCorrectCategory(
  asset: { href: string; mediaType: string; size: number },
  assets: {
    images: Array<{ href: string; mediaType: string; size: number }>;
    audio: Array<{ href: string; mediaType: string; size: number }>;
    video: Array<{ href: string; mediaType: string; size: number }>;
    fonts: Array<{ href: string; mediaType: string; size: number }>;
    other: Array<{ href: string; mediaType: string; size: number }>;
  }
): void {
  if (asset.mediaType.startsWith('image/')) {
    assets.images.push(asset);
  } else if (asset.mediaType.startsWith('audio/')) {
    assets.audio.push(asset);
  } else if (asset.mediaType.startsWith('video/')) {
    assets.video.push(asset);
  } else if (asset.mediaType.includes('font')) {
    assets.fonts.push(asset);
  } else {
    assets.other.push(asset);
  }
}

/**
 * Create empty assets object
 * @returns Empty embedded assets structure
 */
export function createEmptyAssets(): {
  images: Array<{ href: string; mediaType: string; size: number }>;
  audio: Array<{ href: string; mediaType: string; size: number }>;
  video: Array<{ href: string; mediaType: string; size: number }>;
  fonts: Array<{ href: string; mediaType: string; size: number }>;
  other: Array<{ href: string; mediaType: string; size: number }>;
} {
  return {
    images: [],
    audio: [],
    video: [],
    fonts: [],
    other: [],
  };
}
