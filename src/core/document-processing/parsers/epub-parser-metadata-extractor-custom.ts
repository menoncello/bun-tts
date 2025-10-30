/**
 * EPUB Parser Metadata Extractor - Custom Fields
 *
 * Custom metadata field processing functions
 */

import type { EpubMetadata } from './epub-parser-types.js';

/**
 * Extract and format custom metadata fields
 * @param {EpubMetadata} metadata - Raw EPUB metadata array
 * @returns {Record<string, string>} Object containing custom metadata fields
 */
export function createCustomMetadata(
  metadata: EpubMetadata
): Record<string, string | undefined> {
  if (isInvalidMetadata(metadata)) {
    return createEmptyCustomMetadata();
  }

  if (!Array.isArray(metadata)) {
    return createDefaultCustomMetadata();
  }

  const entries = findMetadataEntries(metadata);
  return buildCustomMetadataResult(entries);
}

/**
 * Check if metadata is invalid (null or undefined)
 * @param {EpubMetadata} metadata - Metadata to check
 * @returns {boolean} True if metadata is invalid
 */
function isInvalidMetadata(metadata: EpubMetadata): boolean {
  return metadata === null || metadata === undefined;
}

/**
 * Create empty custom metadata object
 * @returns {Record<string, string | undefined>} Empty metadata object
 */
function createEmptyCustomMetadata(): Record<string, string | undefined> {
  return {
    description: undefined,
    rights: undefined,
    format: undefined,
    subject: '',
    type: '',
  };
}

/**
 * Create default custom metadata object with empty strings
 * @returns {Record<string, string | undefined>} Default metadata object
 */
function createDefaultCustomMetadata(): Record<string, string | undefined> {
  return {
    description: '',
    rights: '',
    format: '',
    subject: '',
    type: '',
  };
}

/**
 * Find metadata entries for each field type
 * @param {EpubMetadata} metadata - Metadata array to search
 * @returns {{ descriptionEntry: { type: string; value?: unknown } | undefined; rightsEntry: { type: string; value?: unknown } | undefined; formatEntry: { type: string; value?: unknown } | undefined; subjectEntry: { type: string; value?: unknown } | undefined; typeEntry: { type: string; value?: unknown; metaType?: string } | undefined; }} Object containing found metadata entries
 */
function findMetadataEntries(metadata: EpubMetadata): {
  descriptionEntry: { type: string; value?: unknown } | undefined;
  rightsEntry: { type: string; value?: unknown } | undefined;
  formatEntry: { type: string; value?: unknown } | undefined;
  subjectEntry: { type: string; value?: unknown } | undefined;
  typeEntry: { type: string; value?: unknown; metaType?: string } | undefined;
} {
  const descriptionEntry = metadata.find(
    (entry) => entry && entry.type === 'description'
  );
  const rightsEntry = metadata.find(
    (entry) => entry && entry.type === 'rights'
  );
  const formatEntry = metadata.find(
    (entry) => entry && entry.type === 'format'
  );
  const subjectEntry = metadata.find(
    (entry) => entry && entry.type === 'subject'
  );
  const typeEntry = metadata.find((entry) => entry && entry.type === 'type');

  return {
    descriptionEntry,
    rightsEntry,
    formatEntry,
    subjectEntry,
    typeEntry,
  };
}

/**
 * Build the final custom metadata result
 * @param {{ descriptionEntry: { type: string; value?: unknown } | undefined; rightsEntry: { type: string; value?: unknown } | undefined; formatEntry: { type: string; value?: unknown } | undefined; subjectEntry: { type: string; value?: unknown } | undefined; typeEntry: { type: string; value?: unknown; metaType?: string } | undefined; }} entries - Found metadata entries
 * @param {{ type: string; value?: unknown } | undefined} entries.descriptionEntry - Description metadata entry
 * @param {{ type: string; value?: unknown } | undefined} entries.rightsEntry - Rights metadata entry
 * @param {{ type: string; value?: unknown } | undefined} entries.formatEntry - Format metadata entry
 * @param {{ type: string; value?: unknown } | undefined} entries.subjectEntry - Subject metadata entry
 * @param {{ type: string; value?: unknown; metaType?: string } | undefined} entries.typeEntry - Type metadata entry
 * @returns {Record<string, string | undefined>} Final metadata result
 */
function buildCustomMetadataResult(entries: {
  descriptionEntry: { type: string; value?: unknown } | undefined;
  rightsEntry: { type: string; value?: unknown } | undefined;
  formatEntry: { type: string; value?: unknown } | undefined;
  subjectEntry: { type: string; value?: unknown } | undefined;
  typeEntry: { type: string; value?: unknown; metaType?: string } | undefined;
}): Record<string, string | undefined> {
  return {
    description: formatMetadataValue(entries.descriptionEntry?.value),
    rights: formatMetadataValue(entries.rightsEntry?.value),
    format: formatMetadataValue(entries.formatEntry?.value),
    subject: formatSubjectValue(entries.subjectEntry),
    type: formatTypeValue(entries.typeEntry),
  };
}

/**
 * Format metadata value to ensure it's a string
 * @param {unknown} value - Raw metadata value
 * @returns {string} Formatted string value
 */
function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  // Convert non-string values to empty string for edge cases
  // Tests expect functions, objects, arrays, dates, etc. to become empty strings
  return '';
}

/**
 * Format subject value from metadata entry
 * @param {{ type: string; value?: unknown } | undefined} subjectEntry - Subject metadata entry
 * @returns {string} Formatted subject string
 */
function formatSubjectValue(
  subjectEntry: { type: string; value?: unknown } | undefined
): string {
  if (!subjectEntry || !subjectEntry.value) return '';

  if (typeof subjectEntry.value === 'string') {
    return subjectEntry.value;
  }

  return '';
}

/**
 * Format type value from metadata entry
 * @param {{ type: string; value?: unknown; metaType?: unknown } | undefined} typeEntry - Type metadata entry
 * @returns {string} Formatted type string
 */
function formatTypeValue(
  typeEntry: { type: string; value?: unknown; metaType?: unknown } | undefined
): string {
  if (!typeEntry) return '';

  // Check if value is a non-empty string
  if (typeof typeEntry.value === 'string' && typeEntry.value.trim() !== '') {
    return typeEntry.value;
  }

  // Fall back to metaType if value is empty or not provided
  if (typeof typeEntry.metaType === 'string') {
    return typeEntry.metaType;
  }

  return '';
}
