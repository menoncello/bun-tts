/**
 * EPUB Parser Type Adapter
 *
 * Provides type compatibility between string-based metadata types
 * and the @smoores/epub library's ElementName constraints
 */

import type { MetadataEntry, ElementName } from '@smoores/epub';

/**
 * Dublin Core metadata types that map to valid ElementName types
 * These are the standard metadata field names used in EPUB files
 */
export const DUBLIN_CORE_TYPES = {
  // Basic metadata
  TITLE: 'title',
  CREATOR: 'creator',
  CONTRIBUTOR: 'contributor',
  SUBJECT: 'subject',
  DESCRIPTION: 'description',
  PUBLISHER: 'publisher',
  DATE: 'date',
  TYPE: 'type',
  FORMAT: 'format',
  IDENTIFIER: 'identifier',
  SOURCE: 'source',
  LANGUAGE: 'language',
  RELATION: 'relation',
  COVERAGE: 'coverage',
  RIGHTS: 'rights',
} as const;

/**
 * Type alias for Dublin Core metadata type values
 */
export type DublinCoreType =
  (typeof DUBLIN_CORE_TYPES)[keyof typeof DUBLIN_CORE_TYPES];

/**
 * Extended metadata types including common EPUB-specific fields
 */
export const METADATA_TYPES = {
  ...DUBLIN_CORE_TYPES,
  // Additional common metadata types
  ISBN: 'isbn',
  METADATA: 'metadata',
  META: 'meta',
  LINK: 'link',
  SCHEMA: 'schema',
  PREFIX: 'prefix',
  PROPERTY: 'property',
  REFINES: 'refines',
  ID: 'id',
  LANG: 'lang',
  DIR: 'dir',
} as const;

/**
 * Type alias for all supported metadata type values
 */
export type MetadataType = (typeof METADATA_TYPES)[keyof typeof METADATA_TYPES];

/**
 * Validates if a string is a valid ElementName according to XML naming rules
 * @param {string} type - String to validate
 * @returns {type is ElementName} True if the string is a valid ElementName
 */
export function isValidElementName(type: string): type is ElementName {
  // ElementName must start with a letter or underscore
  // and can contain letters, digits, hyphens, underscores, and periods
  const elementNamePattern = /^[A-Z_a-z][\w.-]*$/;
  return elementNamePattern.test(type) && type.length > 0;
}

/**
 * Converts a string to a valid ElementName type
 * If the string is not valid, it will be transformed to be valid
 * @param {string} type - String to convert
 * @returns {ElementName} Valid ElementName
 */
export function toElementName(type: string): ElementName {
  // If already valid, return as-is with type assertion
  if (isValidElementName(type)) {
    return type as ElementName;
  }

  // Transform invalid names to valid ones:
  // 1. Replace invalid starting characters with underscore
  // 2. Replace invalid characters with underscores
  let transformed = type.replace(/^[^A-Z_a-z]/, '_').replace(/[^\w.-]/g, '_');

  // Ensure we don't end up with an empty string
  if (transformed.length === 0) {
    transformed = 'unknown';
  }

  return transformed as ElementName;
}

/**
 * Creates a MetadataEntry with proper type safety
 * @param {string} type - Metadata type (will be converted to valid ElementName)
 * @param {string | undefined} value - Metadata value
 * @param {Record<string, string>} [properties] - Additional properties
 * @param {string} [id] - Optional ID
 * @returns {MetadataEntry} MetadataEntry with proper ElementName type
 */
export function createMetadataEntry(
  type: string,
  value: string | undefined,
  properties: Record<string, string> = {},
  id?: string
): MetadataEntry {
  return {
    id,
    type: toElementName(type),
    properties,
    value,
  };
}

/**
 * Type-safe metadata entry builder for Dublin Core fields
 */
export class MetadataBuilder {
  private entries: MetadataEntry[] = [];

  /**
   * Add a title entry
   * @param {string} title - Book title
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  title(title: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.TITLE, title, properties)
    );
    return this;
  }

  /**
   * Add a creator entry
   * @param {string} creator - Creator name
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  creator(creator: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.CREATOR, creator, properties)
    );
    return this;
  }

  /**
   * Add a contributor entry
   * @param {string} contributor - Contributor name
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  contributor(
    contributor: string,
    properties: Record<string, string> = {}
  ): this {
    this.entries.push(
      createMetadataEntry(
        DUBLIN_CORE_TYPES.CONTRIBUTOR,
        contributor,
        properties
      )
    );
    return this;
  }

  /**
   * Add a publisher entry
   * @param {string} publisher - Publisher name
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  publisher(publisher: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.PUBLISHER, publisher, properties)
    );
    return this;
  }

  /**
   * Add a description entry
   * @param {string} description - Book description
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  description(
    description: string,
    properties: Record<string, string> = {}
  ): this {
    this.entries.push(
      createMetadataEntry(
        DUBLIN_CORE_TYPES.DESCRIPTION,
        description,
        properties
      )
    );
    return this;
  }

  /**
   * Add a rights entry
   * @param {string} rights - Copyright information
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  rights(rights: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.RIGHTS, rights, properties)
    );
    return this;
  }

  /**
   * Add an identifier entry
   * @param {string} identifier - Book identifier (ISBN, UUID, etc.)
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  identifier(
    identifier: string,
    properties: Record<string, string> = {}
  ): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.IDENTIFIER, identifier, properties)
    );
    return this;
  }

  /**
   * Add a language entry
   * @param {string} language - Language code
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  language(language: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.LANGUAGE, language, properties)
    );
    return this;
  }

  /**
   * Add a date entry
   * @param {string} date - Date string
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  date(date: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.DATE, date, properties)
    );
    return this;
  }

  /**
   * Add a subject entry
   * @param {string} subject - Subject or keyword
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  subject(subject: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.SUBJECT, subject, properties)
    );
    return this;
  }

  /**
   * Add a format entry
   * @param {string} format - Format specification
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  format(format: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.FORMAT, format, properties)
    );
    return this;
  }

  /**
   * Add a type entry
   * @param {string} type - Publication type
   * @param {Record<string, string>} [properties] - Optional properties
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  type(type: string, properties: Record<string, string> = {}): this {
    this.entries.push(
      createMetadataEntry(DUBLIN_CORE_TYPES.TYPE, type, properties)
    );
    return this;
  }

  /**
   * Add a custom metadata entry
   * @param {string} type - Custom type name
   * @param {string | undefined} value - Metadata value
   * @param {Record<string, string>} [properties] - Optional properties
   * @param {string} [id] - Optional ID
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  custom(
    type: string,
    value: string | undefined,
    properties: Record<string, string> = {},
    id?: string
  ): this {
    this.entries.push(createMetadataEntry(type, value, properties, id));
    return this;
  }

  /**
   * Build the metadata entries array
   * @returns {MetadataEntry[]} {Array of MetadataEntry objects}
   */
  build(): MetadataEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all entries
   * @returns {this} The MetadataBuilder instance for method chaining
   */
  clear(): this {
    this.entries = [];
    return this;
  }
}

/**
 * Helper function to create a new MetadataBuilder
 * @returns {MetadataBuilder} New MetadataBuilder instance
 */
export function createMetadataBuilder(): MetadataBuilder {
  return new MetadataBuilder();
}

/**
 * Safely extracts the type from a MetadataEntry as a string
 * @param {MetadataEntry} entry - MetadataEntry to extract type from
 * @returns {string} Type as string
 */
export function getMetadataType(entry: MetadataEntry): string {
  return entry.type as string;
}

/**
 * Type guard to check if a MetadataEntry has a specific type
 * @param {MetadataEntry} entry - MetadataEntry to check
 * @param {string} type - Type to check for
 * @returns {boolean} True if the entry has the specified type
 */
export function isMetadataType(entry: MetadataEntry, type: string): boolean {
  return getMetadataType(entry) === type;
}

/**
 * Find metadata entries by type (case-insensitive)
 * @param {MetadataEntry[]} metadata - Array of metadata entries
 * @param {string} type - Type to search for
 * @returns {MetadataEntry[]} Array of matching entries
 */
export function findMetadataByType(
  metadata: MetadataEntry[],
  type: string
): MetadataEntry[] {
  const targetLower = type.toLowerCase();
  return metadata.filter(
    (entry) => getMetadataType(entry).toLowerCase() === targetLower
  );
}

/**
 * Find the first metadata entry by type
 * @param {MetadataEntry[]} metadata - Array of metadata entries
 * @param {string} type - Type to search for
 * @returns {MetadataEntry | undefined} First matching entry or undefined
 */
export function findFirstMetadataByType(
  metadata: MetadataEntry[],
  type: string
): MetadataEntry | undefined {
  return findMetadataByType(metadata, type)[0];
}
