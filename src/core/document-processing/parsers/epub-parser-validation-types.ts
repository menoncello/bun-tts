/**
 * EPUB Parser Validation Types
 * Contains type definitions for validation operations
 */

import { Epub } from '@smoores/epub';
import type { EpubMetadata } from './epub-parser-types';

// Constants for validation
export const MAX_SPINE_ITEMS = 10000;
export const MAX_MANIFEST_ITEMS = 10000;
export const MAX_CHAPTER_COUNT = 1000;
export const MIN_TITLE_LENGTH = 1;
export const MAX_TITLE_LENGTH = 255;
export const MIN_LANGUAGE_LENGTH = 2;
export const MAX_LANGUAGE_LENGTH = 10;

// Additional constants for magic numbers
export const DEFAULT_SAMPLE_SIZE = 10;
export const MEGABYTE = 1024;
export const LARGE_CONTENT_THRESHOLD = MEGABYTE * MEGABYTE; // 1MB
export const MAX_TOTAL_ITEMS = 50000;
export const MIN_EPUB_VERSION = 2.0;
export const MAX_AUTHOR_NAME_LENGTH = 255;

// Error message constants
export const MSG_MISSING_METADATA = 'EPUB metadata is missing or empty';
export const MSG_MISSING_SPINE = 'EPUB spine is missing or empty';
export const MSG_MISSING_MANIFEST = 'EPUB manifest is missing or empty';
export const MSG_UNKNOWN_ERROR = 'Unknown error';

// Location path constants
export const SPINE_LOCATION_PREFIX = 'spine[';
export const MANIFEST_LOCATION_PREFIX = 'manifest[';

// Types to replace 'any'
export interface SpineItem {
  id: string;
  href: string;
  linear?: string;
  mediaType?: string;
}

export interface ManifestItem {
  href: string;
  mediaType?: string;
}

export interface ManifestRecord {
  [key: string]: ManifestItem;
}

// Parameter objects for functions with too many parameters
export interface BasicStructureParams {
  epub: Epub;
  metadata: EpubMetadata;
  spineItems: SpineItem[];
  manifest: ManifestRecord;
  result: ValidationResult;
}

export interface StandardStructureParams extends BasicStructureParams {
  config: ValidationConfig;
}

/**
 * Validation levels for different use cases
 */
export enum ValidationLevel {
  BASIC = 'basic', // Check only required structure
  STANDARD = 'standard', // Standard validation with content checks
  STRICT = 'strict', // Comprehensive validation with security checks
}

/**
 * Validation configuration options
 */
export interface ValidationConfig {
  level: ValidationLevel;
  maxSize?: number;
  maxSpineItems?: number;
  maxManifestItems?: number;
  allowExperimental?: boolean;
  securityCheck?: boolean;
}

/**
 * Validation result with detailed information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
  location?: string;
  fix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationMetadata {
  epubVersion?: string;
  title?: string;
  author?: string;
  language?: string;
  fileSize: number;
  spineItemCount: number;
  manifestItemCount: number;
  hasNavigation: boolean;
  hasMetadata: boolean;
}
