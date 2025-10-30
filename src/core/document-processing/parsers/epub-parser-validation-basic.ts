/**
 * EPUB Parser Basic Validation
 * Contains basic validation logic for EPUB structure
 *
 * This module has been refactored into smaller, focused modules:
 * - epub-parser-validation-basic-core.ts: Core validation logic and result handling
 * - epub-parser-validation-basic-structure.ts: EPUB structure validation
 * - epub-parser-validation-basic-metadata.ts: EPUB metadata validation
 * - epub-parser-validation-basic-helpers.ts: Helper utility functions
 */

// Re-export all functions from the core module for backward compatibility
export {
  createInitialValidationResult,
  updateValidationMetadata,
  handleValidationError,
  validateBasicEpubStructure,
  validateBasicStructure,
  validateEPUBStructure,
} from './epub-parser-validation-basic-core.js';

// Re-export structure validation functions
export {
  validateMetadataPresence,
  validateSpinePresence,
  validateManifestPresence,
  validateStructureComponents,
} from './epub-parser-validation-basic-structure.js';

// Re-export metadata validation functions
export {
  validateTitleMetadata,
  validateBasicMetadata,
  validateEPUBMetadata,
} from './epub-parser-validation-basic-metadata.js';

// Re-export helper functions
export {
  determineValidity,
  validateEPUBSpine,
  validateEPUBManifest,
} from './epub-parser-validation-basic-helpers.js';
