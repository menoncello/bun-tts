/**
 * EPUB Parser Compatibility Layer
 *
 * Handles EPUB version differences and provides compatibility layers
 * for different EPUB specifications (2.0, 3.0, 3.1+)
 */

import type { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger';
import {
  extractVersionFromMetadata,
  detectVersionFromStructure,
  type RawEpubMetadata,
} from './epub-parser-compatibility-utils';
import { analyzeContentCompatibility } from './epub-parser-content-analysis';

// Re-export compatibility fix functions
export {
  applyCompatibilityFixes,
  applyCompatibilityFixesToTOC,
} from './epub-parser-compatibility-fixes';

/**
 * EPUB version enumeration
 */
export enum EPUBVersion {
  EPUB_2_0 = '2.0',
  EPUB_3_0 = '3.0',
  EPUB_3_1 = '3.1',
  EPUB_3_2 = '3.2',
  UNKNOWN = 'unknown',
}

/**
 * EPUB specification feature support
 */
export interface EPUBFeatureSupport {
  html5: boolean;
  scripting: boolean;
  audioVideo: boolean;
  fixedLayout: boolean;
  mediaOverlays: boolean;
  javascript: boolean;
  svg: boolean;
  css3: boolean;
}

/**
 * Compatibility layer configuration
 */
export interface CompatibilityConfig {
  strictMode: boolean;
  enableFallbacks: boolean;
  preferredVersion?: EPUBVersion;
  logCompatibilityWarnings: boolean;
}

/**
 * EPUB compatibility analysis result
 */
export interface CompatibilityAnalysis {
  detectedVersion: EPUBVersion;
  featureSupport: EPUBFeatureSupport;
  warnings: string[];
  requiredFallbacks: string[];
  isCompatible: boolean;
}

/**
 * Default compatibility configuration
 */
const DEFAULT_COMPATIBILITY_CONFIG: CompatibilityConfig = {
  strictMode: false,
  enableFallbacks: true,
  logCompatibilityWarnings: true,
};

/**
 * Feature support matrix by EPUB version
 */
const VERSION_FEATURE_SUPPORT: Record<EPUBVersion, EPUBFeatureSupport> = {
  [EPUBVersion.EPUB_2_0]: {
    html5: false,
    scripting: false,
    audioVideo: false,
    fixedLayout: false,
    mediaOverlays: false,
    javascript: false,
    svg: true,
    css3: false,
  },
  [EPUBVersion.EPUB_3_0]: {
    html5: true,
    scripting: true,
    audioVideo: true,
    fixedLayout: true,
    mediaOverlays: true,
    javascript: true,
    svg: true,
    css3: true,
  },
  [EPUBVersion.EPUB_3_1]: {
    html5: true,
    scripting: true,
    audioVideo: true,
    fixedLayout: true,
    mediaOverlays: true,
    javascript: true,
    svg: true,
    css3: true,
  },
  [EPUBVersion.EPUB_3_2]: {
    html5: true,
    scripting: true,
    audioVideo: true,
    fixedLayout: true,
    mediaOverlays: true,
    javascript: true,
    svg: true,
    css3: true,
  },
  [EPUBVersion.UNKNOWN]: {
    html5: false,
    scripting: false,
    audioVideo: false,
    fixedLayout: false,
    mediaOverlays: false,
    javascript: false,
    svg: false,
    css3: false,
  },
};

/**
 * Detect EPUB version from metadata
 * @param epub - EPUB instance to analyze
 * @returns Detected EPUB version
 */
async function detectVersionFromMetadata(epub: Epub): Promise<EPUBVersion> {
  try {
    const metadata = await epub.getMetadata();
    return extractVersionFromMetadata(metadata as unknown as RawEpubMetadata);
  } catch (error) {
    logger.warn('Failed to extract version from metadata', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return EPUBVersion.UNKNOWN;
  }
}

/**
 * Log version detection result
 * @param version - Detected version
 * @param source - Detection source
 * @param config - Compatibility configuration
 */
function logVersionDetection(
  version: EPUBVersion,
  source: string,
  config: CompatibilityConfig
): void {
  if (config.logCompatibilityWarnings && version !== EPUBVersion.UNKNOWN) {
    logger.info(`EPUB version detected from ${source}`, {
      parser: 'EPUBParser',
      version,
    });
  }
}

/**
 * Detect EPUB version from metadata and structure
 * @param epub - EPUB instance to analyze
 * @param config - Compatibility configuration
 * @returns Detected EPUB version
 */
export async function detectEPUBVersion(
  epub: Epub,
  config: CompatibilityConfig = DEFAULT_COMPATIBILITY_CONFIG
): Promise<EPUBVersion> {
  // Try metadata detection first
  const metadataVersion = await detectVersionFromMetadata(epub);
  if (metadataVersion !== EPUBVersion.UNKNOWN) {
    logVersionDetection(metadataVersion, 'metadata', config);
    return metadataVersion;
  }

  // Fallback to structure detection
  const structuralVersion = await detectVersionFromStructure(epub);
  logVersionDetection(structuralVersion, 'structure', config);
  return structuralVersion;
}

/**
 * Create basic compatibility analysis
 * @param detectedVersion - Detected EPUB version
 * @param config - Compatibility configuration
 * @returns Basic compatibility analysis
 */
function createBasicAnalysis(
  detectedVersion: EPUBVersion,
  config: CompatibilityConfig
): { warnings: string[]; requiredFallbacks: string[]; isCompatible: boolean } {
  const warnings: string[] = [];
  const requiredFallbacks: string[] = [];

  // Check for unknown version
  if (detectedVersion === EPUBVersion.UNKNOWN) {
    warnings.push(
      'Unable to detect EPUB version, using fallback compatibility'
    );
    requiredFallbacks.push('generic_epub_support');
  }

  // Check for EPUB 2.0 limitations
  if (detectedVersion === EPUBVersion.EPUB_2_0) {
    warnings.push('EPUB 2.0 detected - limited feature support');
    requiredFallbacks.push('basic_content_processing');
  }

  const isCompatible = !config.strictMode || warnings.length === 0;

  return { warnings, requiredFallbacks, isCompatible };
}

/**
 * Analyze EPUB compatibility
 * @param epub - EPUB instance to analyze
 * @param config - Compatibility configuration
 * @returns Compatibility analysis result
 */
export async function analyzeCompatibility(
  epub: Epub,
  config: CompatibilityConfig = DEFAULT_COMPATIBILITY_CONFIG
): Promise<CompatibilityAnalysis> {
  const detectedVersion = await detectEPUBVersion(epub, config);
  const featureSupport = VERSION_FEATURE_SUPPORT[detectedVersion];
  const { warnings, requiredFallbacks, isCompatible } = createBasicAnalysis(
    detectedVersion,
    config
  );

  // Check for content that might not match detected version
  await analyzeContentCompatibility(
    epub,
    detectedVersion,
    warnings,
    requiredFallbacks
  );

  return {
    detectedVersion,
    featureSupport,
    warnings,
    requiredFallbacks,
    isCompatible,
  };
}
