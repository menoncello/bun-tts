/**
 * PDF Parser chapter utility functions.
 * These utilities handle chapter processing and analysis.
 */

import type { Section, EnhancedChapter } from '../document-structure';

// Constants for chapter processing
const MIN_CHAPTER_HEADING_LENGTH = 3;
const MAX_CHAPTER_HEADING_LENGTH = 100;
const TITLE_CHANGE_THRESHOLD = 10;
const CONTENT_LENGTH_THRESHOLD = 100;
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 50;

// Constants for depth levels
const CHAPTER_DEPTH = 1;
const SECTION_DEPTH = 2;
const SUBSECTION_DEPTH = 3;
const DEFAULT_DEPTH = 1;

// Constants for confidence calculations
const BASE_CONFIDENCE = 0.7;
const CONTENT_LENGTH_CONFIDENCE_BOOST = 0.15;
const TITLE_STRUCTURE_CONFIDENCE_BOOST = 0.15;
const SUBCHAPTER_CONFIDENCE_BOOST = 0.1;
const MAX_CONFIDENCE = 1.0;

// Constants for complexity analysis
const SIMPLE_MAX_DEPTH = 1.5;
const MODERATE_MAX_DEPTH = 2.5;

// Constants for reading time calculation
const AVERAGE_READING_SPEED = 200; // words per minute

/**
 * Creates a new chapter object with the given title and ID.
 *
 * @param {string} title - Chapter title
 * @param {string} chapterId - Chapter ID
 * @returns {EnhancedChapter} New chapter object
 */
export function createChapter(
  title: string,
  chapterId: string
): EnhancedChapter {
  return {
    id: chapterId,
    title,
    content: [],
    subChapters: [],
    depth: 1,
    level: 1,
    paragraphs: [],
    position: 0,
    charRange: { start: 0, end: 0 },
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: 0,
    endPosition: 0,
    startIndex: 0,
  };
}

/**
 * Creates a default chapter when no chapter heading is found.
 *
 * @param {string} line - First line of content
 * @returns {EnhancedChapter} Default chapter object
 */
export function createDefaultChapter(line: string): EnhancedChapter {
  return {
    id: 'chapter-1',
    title: 'Introduction',
    content: [line],
    subChapters: [],
    depth: 1,
    level: 1,
    paragraphs: [],
    position: 0,
    charRange: { start: 0, end: 0 },
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: 0,
    endPosition: 0,
    startIndex: 0,
  };
}

/**
 * Creates an untitled fallback chapter when no chapters are found.
 *
 * @param {string[]} lines - All text lines
 * @returns {EnhancedChapter} Untitled chapter object
 */
export function createUntitledChapter(lines: string[]): EnhancedChapter {
  return {
    id: 'chapter-1',
    title: 'Untitled Chapter',
    content: lines,
    subChapters: [],
    depth: 1,
    level: 1,
    paragraphs: [],
    position: 0,
    charRange: { start: 0, end: 0 },
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: 0,
    endPosition: 0,
    startIndex: 0,
  };
}

/**
 * Processes a single line and updates chapter structure accordingly.
 *
 * @param {string} line - Text line to process
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @param {EnhancedChapter | null} currentChapter - Current chapter being processed
 * @returns {EnhancedChapter | null} Updated current chapter
 */
export function processLineIntoChapter(
  line: string,
  chapters: EnhancedChapter[],
  currentChapter: EnhancedChapter | null
): EnhancedChapter | null {
  const trimmedLine = line.trim();

  // Skip empty lines
  if (trimmedLine.length === 0) {
    return currentChapter;
  }

  // Check if this line looks like a chapter heading
  if (isChapterHeading(trimmedLine)) {
    // Save the previous chapter if it exists
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    // Start a new chapter
    return createChapter(trimmedLine, `chapter-${chapters.length + 1}`);
  }

  if (currentChapter) {
    // Add content to the current chapter
    currentChapter.content.push(trimmedLine);
    return currentChapter;
  }

  // If we haven't found a chapter heading yet, create a default one
  return createDefaultChapter(trimmedLine);
}

/**
 * Processes text lines into chapter structure.
 *
 * @param {string[]} lines - Array of text lines
 * @returns {EnhancedChapter[]} Array of chapters
 */
export function processTextLinesIntoChapters(
  lines: string[]
): EnhancedChapter[] {
  const chapters: EnhancedChapter[] = [];
  let currentChapter: EnhancedChapter | null = null;

  for (const line of lines) {
    currentChapter = processLineIntoChapter(line, chapters, currentChapter);
  }

  // Add the last chapter if it exists
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  return chapters.length > 0 ? chapters : [createUntitledChapter(lines)];
}

/**
 * Checks if a line appears to be a chapter heading.
 *
 * @param {string} line - Text line to check
 * @returns {boolean} True if the line looks like a chapter heading
 */
function isChapterHeading(line: string): boolean {
  // Remove leading/trailing whitespace
  const trimmedLine = line.trim();

  // Skip very short or very long lines
  if (
    trimmedLine.length < MIN_CHAPTER_HEADING_LENGTH ||
    trimmedLine.length > MAX_CHAPTER_HEADING_LENGTH
  ) {
    return false;
  }

  // Check for common chapter heading patterns
  const chapterPatterns = [
    /^chapter\s+\d+/i, // "Chapter 1", "Chapter One"
    /^section\s+\d+/i, // "Section 1", "Section A"
    /^part\s+\d+/i, // "Part 1", "Part I"
    /^\d+\./, // "1.", "2."
    /^[ivx]+\./i, // "I.", "II.", "IV."
    /^[a-z]+\./i, // "a.", "b.", "c."
    /^[a-z]+\./i, // "A.", "B.", "C."
  ];

  return chapterPatterns.some((pattern) => pattern.test(trimmedLine));
}

/**
 * Enhances chapters with hierarchical structure analysis.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters to enhance
 * @returns {EnhancedChapter[]} Enhanced chapters with hierarchical information
 */
export function enhanceChaptersWithHierarchy(
  chapters: EnhancedChapter[]
): EnhancedChapter[] {
  return chapters.map((chapter, index) => {
    const enhancedChapter: EnhancedChapter = { ...chapter };

    // Calculate depth based on title and position
    enhancedChapter.depth = calculateChapterDepth(chapter, chapters, index);

    // Calculate content confidence
    enhancedChapter.confidence = calculateContentConfidence(chapter);

    // Identify potential parent-child relationships
    enhancedChapter.parentId = findParentId(chapter, chapters, index);

    return enhancedChapter;
  });
}

/**
 * Calculates the depth of a chapter in the document hierarchy.
 *
 * @param {EnhancedChapter} chapter - Chapter to analyze
 * @param {EnhancedChapter[]} chapters - All chapters in the document
 * @param {number} index - Index of the chapter in the array
 * @returns {number} Depth level of the chapter
 */
function calculateChapterDepth(
  chapter: EnhancedChapter,
  chapters: EnhancedChapter[],
  index: number
): number {
  const title = chapter.title.toLowerCase();

  // Check for heading patterns
  if (title.startsWith('chapter') || title.startsWith('part')) {
    return CHAPTER_DEPTH;
  } else if (title.startsWith('section')) {
    return SECTION_DEPTH;
  } else if (/^\d+\.\d+/.exec(title)) {
    // Pattern like "1.1", "2.3"
    return SUBSECTION_DEPTH;
  }
  // Calculate relative depth based on position and previous chapters
  return calculateDepthRelativeToPrevious(chapter, chapters, index);
}

/**
 * Calculates depth relative to previous chapters.
 *
 * @param {EnhancedChapter} chapter - Current chapter
 * @param {EnhancedChapter[]} chapters - All chapters
 * @param {number} index - Current chapter index
 * @returns {number} Calculated depth
 */
function calculateDepthRelativeToPrevious(
  chapter: EnhancedChapter,
  chapters: EnhancedChapter[],
  index: number
): number {
  if (index === 0) {
    return DEFAULT_DEPTH; // First chapter is always at depth 1
  }

  const previousChapter = chapters[index - 1];
  if (!previousChapter) {
    return DEFAULT_DEPTH;
  }

  const titleChange = Math.abs(
    chapter.title.length - previousChapter.title.length
  );

  // If this title is significantly shorter, it might be a higher-level heading
  if (
    titleChange > TITLE_CHANGE_THRESHOLD &&
    chapter.title.length < previousChapter.title.length
  ) {
    return Math.max(1, (previousChapter.depth ?? 1) - 1);
  } else if (
    titleChange > TITLE_CHANGE_THRESHOLD &&
    chapter.title.length > previousChapter.title.length
  ) {
    return (previousChapter.depth ?? 1) + 1;
  }
  return previousChapter.depth ?? 1;
}

/**
 * Calculates content confidence score for a chapter.
 *
 * @param {EnhancedChapter} chapter - Chapter to analyze
 * @returns {number} Confidence score between 0 and 1
 */
export function calculateContentConfidence(chapter: EnhancedChapter): number {
  let confidence = BASE_CONFIDENCE; // Base confidence

  // Add confidence based on content length
  const totalContentLength = chapter.content.join(' ').length;
  if (totalContentLength > CONTENT_LENGTH_THRESHOLD) {
    confidence += CONTENT_LENGTH_CONFIDENCE_BOOST;
  }

  // Add confidence based on title structure
  if (
    chapter.title.length > MIN_TITLE_LENGTH &&
    chapter.title.length < MAX_TITLE_LENGTH
  ) {
    confidence += TITLE_STRUCTURE_CONFIDENCE_BOOST;
  }

  // Add confidence based on sub-chapters
  if (chapter.subChapters.length > 0) {
    confidence += SUBCHAPTER_CONFIDENCE_BOOST;
  }

  return Math.min(confidence, MAX_CONFIDENCE);
}

/**
 * Finds the parent ID for a chapter based on hierarchy.
 *
 * @param {EnhancedChapter} chapter - Current chapter
 * @param {EnhancedChapter[]} chapters - All chapters
 * @param {number} index - Current chapter index
 * @returns {string | undefined} Parent chapter ID or undefined
 */
function findParentId(
  chapter: EnhancedChapter,
  chapters: EnhancedChapter[],
  index: number
): string | undefined {
  if (index === 0 || (chapter.depth ?? 1) <= 1) {
    return undefined;
  }

  // Look for the nearest chapter with lower depth
  for (let i = index - 1; i >= 0; i--) {
    const currentChapter = chapters[i];
    if (currentChapter && (currentChapter.depth ?? 1) < (chapter.depth ?? 1)) {
      return currentChapter.id;
    }
  }

  return undefined;
}

/**
 * Extracts sections from chapters.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @returns {Section[]} Array of sections
 */
export function extractSectionsFromChapters(
  chapters: EnhancedChapter[]
): Section[] {
  const sections: Section[] = [];

  for (const [index, chapter] of chapters.entries()) {
    const section: Section = {
      id: `section-${index + 1}`,
      title: chapter.title,
      content: chapter.content || [],
      chapterId: chapter.id,
      startPage: index + 1, // Approximate
      endPage: index + 1, // Approximate
      subsections: [],
    };

    sections.push(section);
  }

  return sections;
}

/**
 * Calculates overall document confidence based on chapters.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @returns {number} Overall confidence score
 */
export function calculateOverallConfidence(
  chapters: EnhancedChapter[]
): number {
  if (chapters.length === 0) {
    return BASE_CONFIDENCE;
  }

  const totalConfidence = chapters.reduce(
    (sum, chapter) => sum + (chapter.confidence ?? BASE_CONFIDENCE),
    0
  );

  return totalConfidence / chapters.length;
}

/**
 * Calculates estimated reading time for the document.
 *
 * @param {string} text - Document text
 * @returns {number} Estimated reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / AVERAGE_READING_SPEED);
}

/**
 * Analyzes document complexity based on structure.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @returns {'simple' | 'moderate' | 'complex'} Complexity assessment
 */
export function analyzeComplexity(
  chapters: EnhancedChapter[]
): 'simple' | 'moderate' | 'complex' {
  const avgDepth =
    chapters.reduce((sum, ch) => sum + (ch.depth ?? 1), 0) / chapters.length;
  const totalSubChapters = chapters.reduce(
    (sum, ch) => sum + (ch.subChapters?.length ?? 0),
    0
  );

  if (avgDepth <= SIMPLE_MAX_DEPTH && totalSubChapters === 0) {
    return 'simple';
  } else if (
    avgDepth <= MODERATE_MAX_DEPTH &&
    totalSubChapters <= chapters.length
  ) {
    return 'moderate';
  }
  return 'complex';
}

/**
 * Calculates average chapter length.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @returns {number} Average chapter content length
 */
export function calculateAverageChapterLength(
  chapters: EnhancedChapter[]
): number {
  if (chapters.length === 0) {
    return 0;
  }

  const totalLength = chapters.reduce(
    (sum, chapter) => sum + chapter.content.join(' ').length,
    0
  );

  return totalLength / chapters.length;
}

/**
 * Calculates maximum depth in the document hierarchy.
 *
 * @param {EnhancedChapter[]} chapters - Array of chapters
 * @returns {number} Maximum depth level
 */
export function calculateMaxDepth(chapters: EnhancedChapter[]): number {
  return Math.max(...chapters.map((chapter) => chapter.depth ?? 1), 0);
}
