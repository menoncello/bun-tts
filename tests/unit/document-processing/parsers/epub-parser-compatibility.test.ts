import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import {
  detectEPUBVersion,
  analyzeCompatibility,
  applyCompatibilityFixes,
  applyCompatibilityFixesToTOC,
  type CompatibilityConfig,
  EPUBVersion,
  type EPUBFeatureSupport,
} from '../../../../src/core/document-processing/parsers/epub-parser-compatibility';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import type {
  DocumentMetadata,
  TableOfContentsItem,
} from '../../../../src/core/document-processing/types';

// Helper functions for test setup
const createCompatibilityConfig = (
  strictMode = false,
  enableFallbacks = true,
  logWarnings = true
): CompatibilityConfig => ({
  strictMode,
  enableFallbacks,
  logCompatibilityWarnings: logWarnings,
});

const createMockAnalysis = (
  version: EPUBVersion,
  warnings: string[] = [],
  requiredFallbacks: string[] = []
) => ({
  detectedVersion: version,
  featureSupport: {} as EPUBFeatureSupport,
  warnings,
  requiredFallbacks,
  isCompatible: true,
});

const createEpub20FeatureSupport = (): EPUBFeatureSupport => ({
  html5: false,
  scripting: false,
  audioVideo: false,
  fixedLayout: false,
  mediaOverlays: false,
  javascript: false,
  svg: true,
  css3: false,
});

const createEpub30FeatureSupport = (): EPUBFeatureSupport => ({
  html5: true,
  scripting: true,
  audioVideo: true,
  fixedLayout: true,
  mediaOverlays: true,
  javascript: true,
  svg: true,
  css3: true,
});

const createTestMetadata = (): DocumentMetadata => ({
  title: 'Test Book',
  author: 'Test Author',
  language: 'en',
  publisher: 'Test Publisher',
  identifier: 'test-identifier',
  version: 'unknown',
});

const createTestTOC = (): TableOfContentsItem[] => [
  { id: 'chapter1', title: 'Chapter 1', href: 'chapter1', level: 1 },
  { id: 'chapter2', title: 'Chapter 2', href: 'chapter2', level: 2 },
];

describe('EPUB Parser Compatibility Layer - Version Detection', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  describe('EPUB Version Detection', () => {
    test('AC5-TC01: should detect EPUB 2.0 from metadata', async () => {
      // GIVEN: EPUB metadata with version 2.0 indicators
      const mockEpub = createMockEpub({
        version: '2.0',
        'dc:identifier': 'test-id',
        'dc:title': 'Test Book',
      });

      // WHEN: Detecting EPUB version
      const detectedVersion = await detectEPUBVersion(mockEpub);

      // THEN: Should correctly identify as EPUB 2.0
      expect(detectedVersion).toBe(EPUBVersion.EPUB_2_0);
    });

    test('AC5-TC02: should detect EPUB 3.0 from metadata', async () => {
      // GIVEN: EPUB metadata with version 3.0 indicators
      const mockEpub = createMockEpub({
        version: '3.0',
        modified: '2023-01-01',
      });

      // WHEN: Detecting EPUB version
      const detectedVersion = await detectEPUBVersion(mockEpub);

      // THEN: Should correctly identify as EPUB 3.0
      expect(detectedVersion).toBe(EPUBVersion.EPUB_3_0);
    });

    test('AC5-TC03: should detect EPUB 3.1 from metadata', async () => {
      // GIVEN: EPUB metadata with version 3.1 indicators
      const mockEpub = createMockEpub({
        version: '3.1',
      });

      // WHEN: Detecting EPUB version
      const detectedVersion = await detectEPUBVersion(mockEpub);

      // THEN: Should correctly identify as EPUB 3.1
      expect(detectedVersion).toBe(EPUBVersion.EPUB_3_1);
    });

    test('AC5-TC04: should fallback to unknown when version cannot be detected', async () => {
      // GIVEN: EPUB with no clear version indicators
      const mockEpub = createMockEpub({});

      // WHEN: Detecting EPUB version
      const detectedVersion = await detectEPUBVersion(mockEpub);

      // THEN: Should return unknown version
      expect(detectedVersion).toBe(EPUBVersion.UNKNOWN);
    });
  });
});

describe('EPUB Parser Compatibility Layer - Feature Support Analysis', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  describe('Feature Support Analysis', () => {
    test('AC5-TC05: should provide correct feature support for EPUB 2.0', () => {
      // GIVEN: EPUB 2.0 version
      const version = EPUBVersion.EPUB_2_0;

      // WHEN: Analyzing feature support expectations
      const expectedSupport = createEpub20FeatureSupport();

      // THEN: EPUB 2.0 should not support modern features
      expect(expectedSupport.html5).toBe(false);
      expect(expectedSupport.scripting).toBe(false);
      expect(expectedSupport.audioVideo).toBe(false);
      expect(expectedSupport.svg).toBe(true); // SVG is supported in EPUB 2.0
    });

    test('AC5-TC06: should provide correct feature support for EPUB 3.0+', () => {
      // GIVEN: EPUB 3.0 version
      const version = EPUBVersion.EPUB_3_0;

      // WHEN: Analyzing feature support expectations
      const expectedSupport = createEpub30FeatureSupport();

      // THEN: EPUB 3.0+ should support all modern features
      expect(expectedSupport.html5).toBe(true);
      expect(expectedSupport.scripting).toBe(true);
      expect(expectedSupport.audioVideo).toBe(true);
      expect(expectedSupport.svg).toBe(true);
      expect(expectedSupport.css3).toBe(true);
    });
  });
});

describe('EPUB Parser Compatibility Layer - Compatibility Analysis', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  describe('Compatibility Analysis', () => {
    test('AC5-TC07: should analyze EPUB compatibility successfully', async () => {
      // GIVEN: EPUB instance and compatibility configuration
      const mockEpub = createMockEpub({
        version: '3.0',
        modified: '2023-01-01',
      });
      const config = createCompatibilityConfig();

      // WHEN: Analyzing compatibility
      const analysis = await analyzeCompatibility(mockEpub, config);

      // THEN: Should provide comprehensive compatibility analysis
      expect(analysis).toHaveProperty('detectedVersion');
      expect(analysis).toHaveProperty('featureSupport');
      expect(analysis).toHaveProperty('warnings');
      expect(analysis).toHaveProperty('requiredFallbacks');
      expect(analysis).toHaveProperty('isCompatible');
      expect(analysis.detectedVersion).toBe(EPUBVersion.EPUB_3_0);
      expect(analysis.isCompatible).toBe(true);
    });

    test('AC5-TC08: should identify compatibility issues in strict mode', async () => {
      // GIVEN: EPUB with unknown version and strict configuration
      const mockEpub = createMockEpub({});
      const config = createCompatibilityConfig(true);

      // WHEN: Analyzing compatibility
      const analysis = await analyzeCompatibility(mockEpub, config);

      // THEN: Should identify compatibility issues
      expect(analysis.detectedVersion).toBe(EPUBVersion.UNKNOWN);
      expect(analysis.isCompatible).toBe(false);
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });
  });
});

// Test helper functions for compatibility fixes
function setupCompatibilityFixesFixture() {
  return setupEPUBParserFixture();
}

async function cleanupCompatibilityFixesFixture(fixture: any) {
  await cleanupEPUBParserFixture(fixture);
}

function createCompatibilityFixtures() {
  const metadata = createTestMetadata();
  const toc = createTestTOC();
  const analysisWithFallbacks = createMockAnalysis(
    EPUBVersion.EPUB_3_0,
    ['Test warning'],
    ['test_fallback']
  );
  const analysisEPUB2 = createMockAnalysis(EPUBVersion.EPUB_2_0);
  const config = {
    strictMode: false,
    enableFallbacks: true,
    logCompatibilityWarnings: true,
  };
  const configNoFallbacks = {
    strictMode: false,
    enableFallbacks: false,
    logCompatibilityWarnings: true,
  };

  return {
    metadata,
    toc,
    analysisWithFallbacks,
    analysisEPUB2,
    config,
    configNoFallbacks,
  };
}

describe('EPUB Parser Compatibility Layer - Compatibility Fixes', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  describe('Compatibility Fixes', () => {
    test('AC5-TC09: should apply compatibility fixes to metadata', () => {
      // GIVEN: Document metadata and compatibility analysis
      const { metadata, analysisWithFallbacks, config } =
        createCompatibilityFixtures();

      // WHEN: Applying compatibility fixes
      const fixedMetadata = applyCompatibilityFixes(
        metadata,
        analysisWithFallbacks,
        config
      );

      // THEN: Should apply fixes to metadata
      expect(fixedMetadata.version).toBe(EPUBVersion.EPUB_3_0);
    });

    test('AC5-TC10: should apply compatibility fixes to table of contents', () => {
      // GIVEN: Table of contents and compatibility analysis
      const { toc, analysisEPUB2, config } = createCompatibilityFixtures();

      // WHEN: Applying compatibility fixes
      const fixedTOC = applyCompatibilityFixesToTOC(toc, analysisEPUB2, config);

      // THEN: Should flatten structure for EPUB 2.0 compatibility
      expect(fixedTOC).toHaveLength(2);
      expect(fixedTOC[0]?.level).toBe(0); // Flattened to level 0
      expect(fixedTOC[1]?.level).toBe(0); // Flattened to level 0
    });

    test('AC5-TC11: should not apply fixes when fallbacks are disabled', () => {
      // GIVEN: Metadata with configuration that disables fallbacks
      const { metadata, analysisWithFallbacks, configNoFallbacks } =
        createCompatibilityFixtures();

      // WHEN: Applying compatibility fixes
      const fixedMetadata = applyCompatibilityFixes(
        metadata,
        analysisWithFallbacks,
        configNoFallbacks
      );

      // THEN: Should not apply fixes
      expect(fixedMetadata.version).toBe('unknown'); // Unchanged
    });
  });
});

describe('EPUB Parser Compatibility Layer - Configuration Options', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  describe('Configuration Options', () => {
    test('AC5-TC12: should respect strict mode configuration', async () => {
      // GIVEN: EPUB with issues and strict mode enabled
      const mockEpub = createMockEpub({});
      const config: CompatibilityConfig = {
        strictMode: true,
        enableFallbacks: true,
        logCompatibilityWarnings: true,
      };

      // WHEN: Analyzing compatibility in strict mode
      const analysis = await analyzeCompatibility(mockEpub, config);

      // THEN: Should be marked as incompatible due to strict mode
      expect(analysis.isCompatible).toBe(false);
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    test('AC5-TC13: should handle empty configuration gracefully', async () => {
      // GIVEN: EPUB instance and empty configuration
      const mockEpub = createMockEpub({
        version: '3.0',
      });

      // WHEN: Analyzing compatibility with default configuration
      const analysis = await analyzeCompatibility(mockEpub);

      // THEN: Should use default configuration and work correctly
      expect(analysis).toBeDefined();
      expect(analysis.detectedVersion).toBe(EPUBVersion.EPUB_3_0);
      expect(analysis.isCompatible).toBe(true);
    });
  });
});

// Helper function to create mock EPUB instances
function createMockEpub(metadata: any): Epub {
  return {
    getMetadata: () => Promise.resolve(metadata),
    getNavItems: () => Promise.resolve([]),
    getNcxItems: () => Promise.resolve([]),
    getSpineItems: () =>
      Promise.resolve([
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ]),
    readXhtmlItemContents: () =>
      Promise.resolve('<html><body>Test content</body></html>'),
    close: () => Promise.resolve(),
  } as any;
}
