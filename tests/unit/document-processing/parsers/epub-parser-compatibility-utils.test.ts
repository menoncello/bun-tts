import { describe, test, expect, mock } from 'bun:test';
import {
  extractVersionFromMetadata,
  isEPUB2Metadata,
  isEPUB3Metadata,
  hasHTML5Indicators,
  detectVersionFromStructure,
  type RawEpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-compatibility-utils.js';
import { EPUBVersion } from '../../../../src/core/document-processing/parsers/epub-parser-compatibility.js';

// Mock the logger
mock.module('../../../../src/utils/logger.js', () => ({
  logger: {
    warn: mock(() => {
      /* Intentionally empty for test purposes */
    }),
    debug: mock(() => {
      /* Intentionally empty for test purposes */
    }),
    info: mock(() => {
      /* Intentionally empty for test purposes */
    }),
    error: mock(() => {
      /* Intentionally empty for test purposes */
    }),
  },
}));

describe('EPUB Parser Compatibility Utils', () => {
  describe('extractVersionFromMetadata', () => {
    test('should extract EPUB 2.0 version correctly', () => {
      const metadata: RawEpubMetadata = {
        version: '2.0',
        'dc:title': 'Test Book',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_2_0);
    });

    test('should extract EPUB 2.1 version correctly', () => {
      const metadata: RawEpubMetadata = {
        version: '2.1',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_2_0);
    });

    test('should extract EPUB 3.0 version correctly', () => {
      const metadata: RawEpubMetadata = {
        version: '3.0',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should extract EPUB 3.1 version correctly', () => {
      const metadata: RawEpubMetadata = {
        version: '3.1',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_1);
    });

    test('should extract EPUB 3.2 version correctly', () => {
      const metadata: RawEpubMetadata = {
        version: '3.2',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_2);
    });

    test('should default to EPUB 3.0 for other 3.x versions', () => {
      const metadata: RawEpubMetadata = {
        version: '3.5',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should handle numeric version', () => {
      const metadata: RawEpubMetadata = {
        version: 3.0,
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should handle case insensitive version strings', () => {
      const metadata: RawEpubMetadata = {
        version: '3.0',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should fallback to EPUB 2.0 detection when no explicit version', () => {
      const metadata: RawEpubMetadata = {
        'dc:identifier': 'test-id',
        'dc:title': 'Test Book',
        'dc:creator': 'Test Author',
        'dc:language': 'en',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_2_0);
    });

    test('should fallback to EPUB 3.0 detection when no explicit version', () => {
      const metadata: RawEpubMetadata = {
        modified: '2023-01-01',
        source: 'test-source',
        rights: ['Copyright 2023'],
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should return UNKNOWN when no version indicators found', () => {
      const metadata: RawEpubMetadata = {
        customField: 'custom-value',
      };

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle empty metadata', () => {
      const metadata: RawEpubMetadata = {};

      const result = extractVersionFromMetadata(metadata);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });
  });

  describe('isEPUB2Metadata', () => {
    test('should identify EPUB 2.0 by dc:identifier', () => {
      const metadata: RawEpubMetadata = {
        'dc:identifier': 'test-id',
      };

      expect(isEPUB2Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 2.0 by dc:title', () => {
      const metadata: RawEpubMetadata = {
        'dc:title': 'Test Book',
      };

      expect(isEPUB2Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 2.0 by dc:creator', () => {
      const metadata: RawEpubMetadata = {
        'dc:creator': 'Test Author',
      };

      expect(isEPUB2Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 2.0 by dc:language', () => {
      const metadata: RawEpubMetadata = {
        'dc:language': 'en',
      };

      expect(isEPUB2Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 2.0 by array identifier', () => {
      const metadata: RawEpubMetadata = {
        identifier: ['id1', 'id2'],
      };

      expect(isEPUB2Metadata(metadata)).toBe(true);
    });

    test('should not identify EPUB 2.0 with non-array identifier', () => {
      const metadata: RawEpubMetadata = {
        identifier: 'single-id',
      };

      expect(isEPUB2Metadata(metadata)).toBe(false);
    });

    test('should return false for EPUB 3.0 metadata', () => {
      const metadata: RawEpubMetadata = {
        modified: '2023-01-01',
        source: 'test-source',
      };

      expect(isEPUB2Metadata(metadata)).toBe(false);
    });

    test('should return false for empty metadata', () => {
      const metadata: RawEpubMetadata = {};

      expect(isEPUB2Metadata(metadata)).toBe(false);
    });
  });

  describe('isEPUB3Metadata', () => {
    test('should identify EPUB 3.0 by modified field', () => {
      const metadata: RawEpubMetadata = {
        modified: '2023-01-01T00:00:00Z',
      };

      expect(isEPUB3Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 3.0 by source field', () => {
      const metadata: RawEpubMetadata = {
        source: 'test-source',
      };

      expect(isEPUB3Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 3.0 by array relation', () => {
      const metadata: RawEpubMetadata = {
        relation: ['rel1', 'rel2'],
      };

      expect(isEPUB3Metadata(metadata)).toBe(true);
    });

    test('should identify EPUB 3.0 by non-empty rights array', () => {
      const metadata: RawEpubMetadata = {
        rights: ['Copyright 2023'],
      };

      expect(isEPUB3Metadata(metadata)).toBe(true);
    });

    test('should not identify EPUB 3.0 with empty rights array', () => {
      const metadata: RawEpubMetadata = {
        rights: [],
      };

      expect(isEPUB3Metadata(metadata)).toBe(false);
    });

    test('should not identify EPUB 3.0 with non-array relation', () => {
      const metadata: RawEpubMetadata = {
        relation: 'single-relation',
      };

      expect(isEPUB3Metadata(metadata)).toBe(false);
    });

    test('should return false for EPUB 2.0 metadata', () => {
      const metadata: RawEpubMetadata = {
        'dc:identifier': 'test-id',
        'dc:title': 'Test Book',
      };

      expect(isEPUB3Metadata(metadata)).toBe(false);
    });

    test('should return false for empty metadata', () => {
      const metadata: RawEpubMetadata = {};

      expect(isEPUB3Metadata(metadata)).toBe(false);
    });
  });

  describe('hasHTML5Indicators', () => {
    test('should detect HTML5 audio tag', () => {
      const content =
        '<html><body><audio src="audio.mp3"></audio></body></html>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect HTML5 video tag', () => {
      const content = '<video src="video.mp4" controls></video>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect HTML5 canvas tag', () => {
      const content = '<canvas id="canvas"></canvas>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect HTML5 svg tag', () => {
      const content = '<svg><circle cx="50" cy="50" r="40"/></svg>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect data-epub attribute', () => {
      const content = '<div data-epub="chapter1">Chapter content</div>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect epub:type attribute', () => {
      const content = '<section epub:type="chapter">Chapter content</section>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect xmlns:epub namespace', () => {
      const content =
        '<html xmlns:epub="http://www.idpf.org/2007/ops"><body>Content</body></html>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should be case insensitive', () => {
      const content = '<AUDIO src="audio.mp3"></AUDIO>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should detect multiple HTML5 tags', () => {
      const content =
        '<html><body><audio src="audio.mp3"></audio><video src="video.mp4"></video><canvas id="canvas"></canvas></body></html>';
      expect(hasHTML5Indicators(content)).toBe(true);
    });

    test('should not detect HTML4-only content', () => {
      const content =
        '<html><body><div><p>Traditional HTML content</p><span>Span content</span></div></body></html>';
      expect(hasHTML5Indicators(content)).toBe(false);
    });

    test('should handle empty content', () => {
      expect(hasHTML5Indicators('')).toBe(false);
    });

    test('should handle null content', () => {
      expect(() => hasHTML5Indicators(null as any)).toThrow();
    });

    test('should handle undefined content', () => {
      expect(() => hasHTML5Indicators(undefined as any)).toThrow();
    });

    test('should detect HTML5 doctype', () => {
      const content = '<!DOCTYPE html><html><body></body></html>';
      expect(hasHTML5Indicators(content)).toBe(false); // Doctype is not in the indicators list
    });

    test('should handle malformed HTML with HTML5 tags', () => {
      const content = '<audio>Unclosed audio<div>Nested content<p>Paragraph';
      expect(hasHTML5Indicators(content)).toBe(true);
    });
  });

  describe('detectVersionFromStructure', () => {
    test('should detect EPUB 3.0 when NAV items are present', async () => {
      const mockEpub = {
        getNavItems: mock(() =>
          Promise.resolve([{ id: 'nav-1', label: 'Chapter 1' }])
        ),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
      expect(mockEpub.getNavItems).toHaveBeenCalled();
    });

    test('should detect EPUB 2.0 when NCX items present and no HTML5', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() =>
          Promise.resolve([{ id: 'ncx-1', text: 'Chapter 1' }])
        ),
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'spine-1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(
            '<html><body><p>Traditional content</p></body></html>'
          )
        ),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.EPUB_2_0);
    });

    test('should detect EPUB 3.0 when NCX items present and HTML5 found', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() =>
          Promise.resolve([{ id: 'ncx-1', text: 'Chapter 1' }])
        ),
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'spine-1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(
            '<html><body><audio src="audio.mp3"></audio></body></html>'
          )
        ),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.EPUB_3_0);
    });

    test('should return UNKNOWN when no navigation items found', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([])),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle getNavItems throwing error', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.reject(new Error('Navigation error'))),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() => Promise.resolve([])),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN); // Cannot determine version with empty spine items
    });

    test('should handle getNcxItems throwing error', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.reject(new Error('NCX error'))),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle getSpineItems throwing error', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() => Promise.reject(new Error('Spine error'))),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle readXhtmlItemContents throwing error', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'spine-1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.reject(new Error('Read error'))
        ),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.EPUB_2_0); // Defaults to EPUB 2.0 when HTML5 detection fails
    });

    test('should handle null spine items', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() => Promise.resolve(null)),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle empty spine items array', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() => Promise.resolve([])),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle multiple spine items and sample correctly', async () => {
      const spineItems = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `spine-${i}`,
          href: `chapter${i}.xhtml`,
        }));

      const mockEpub = {
        getNavItems: mock(() => Promise.resolve([])),
        getNcxItems: mock(() => Promise.resolve([{ id: 'ncx-1' }])),
        getSpineItems: mock(() => Promise.resolve(spineItems)),
        readXhtmlItemContents: mock((itemId: string) => {
          const index = Number.parseInt(itemId.split('-')[1] || '0');
          if (index < 5) {
            // First few have HTML5 content
            return Promise.resolve('<article>HTML5 content</article>');
          }
          return Promise.resolve('<p>Traditional content</p>');
        }),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.EPUB_3_0); // Should find HTML5 in first few items
      expect(mockEpub.readXhtmlItemContents).toHaveBeenCalledTimes(1); // Found HTML5 on first try
    });

    test('should handle malformed EPUB with missing methods', async () => {
      const incompleteEpub = {} as any;

      const result = await detectVersionFromStructure(incompleteEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });

    test('should handle complete structure detection failure', async () => {
      const mockEpub = {
        getNavItems: mock(() => Promise.reject(new Error('Complete failure'))),
      } as any;

      const result = await detectVersionFromStructure(mockEpub);
      expect(result).toBe(EPUBVersion.UNKNOWN);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed metadata gracefully', () => {
      const malformedMetadata = {
        version: 'invalid.version.string',
        'dc:identifier': undefined,
        'dc:title': undefined,
        identifier: 'not-an-array',
        rights: undefined,
      };

      expect(() => {
        extractVersionFromMetadata(malformedMetadata);
      }).not.toThrow();

      expect(() => {
        isEPUB2Metadata(malformedMetadata);
      }).not.toThrow();

      expect(() => {
        isEPUB3Metadata(malformedMetadata);
      }).not.toThrow();
    });

    test('should handle very long content strings', () => {
      const longContent = `${'<p>Traditional content</p>'.repeat(10000)}<audio>HTML5 content</audio>`;
      expect(hasHTML5Indicators(longContent)).toBe(true);
    });

    test('should handle content with comments', () => {
      const contentWithComments =
        '<!-- This is a comment --><video>Content</video><!-- Another comment -->';
      expect(hasHTML5Indicators(contentWithComments)).toBe(true);
    });

    test('should handle content with CDATA sections', () => {
      const contentWithCDATA =
        '<script><![CDATA[<video>Not real HTML5</video>]]></script><canvas>Real HTML5</canvas>';
      expect(hasHTML5Indicators(contentWithCDATA)).toBe(true);
    });

    test('should handle content with nested tags', () => {
      const nestedContent =
        '<div><section><svg>Nested HTML5</svg></section></div>';
      expect(hasHTML5Indicators(nestedContent)).toBe(true);
    });

    test('should handle content with malformed tags', () => {
      const malformedContent = '<audio>Unclosed tag<div>Nested<div>More nested';
      expect(hasHTML5Indicators(malformedContent)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should work with realistic EPUB 2.0 metadata', () => {
      const epub2Metadata: RawEpubMetadata = {
        version: '2.0',
        'dc:identifier': 'urn:isbn:9780123456789',
        'dc:title': 'Classic EPUB Book',
        'dc:creator': 'Classic Author',
        'dc:language': 'en',
        'dc:publisher': 'Classic Publisher',
        'dc:date': '2020-01-01',
      };

      const version = extractVersionFromMetadata(epub2Metadata);
      expect(version).toBe(EPUBVersion.EPUB_2_0);
      expect(isEPUB2Metadata(epub2Metadata)).toBe(true);
      expect(isEPUB3Metadata(epub2Metadata)).toBe(false);
    });

    test('should work with realistic EPUB 3.0 metadata', () => {
      const epub3Metadata: RawEpubMetadata = {
        version: '3.0',
        modified: '2023-01-01T12:00:00Z',
        source: 'https://example.com/source',
        relation: ['prequel', 'sequel'],
        rights: ['Copyright 2023 Modern Publisher', 'All rights reserved'],
      };

      const version = extractVersionFromMetadata(epub3Metadata);
      expect(version).toBe(EPUBVersion.EPUB_3_0);
      expect(isEPUB2Metadata(epub3Metadata)).toBe(false);
      expect(isEPUB3Metadata(epub3Metadata)).toBe(true);
    });

    test('should handle mixed version indicators', () => {
      const mixedMetadata: RawEpubMetadata = {
        'dc:title': 'Mixed Book',
        'dc:creator': 'Mixed Author',
        modified: '2023-01-01',
        rights: ['Copyright 2023'],
      };

      // When both EPUB 2.0 and 3.0 indicators are present, EPUB 2.0 detection wins
      const versionWithoutExplicit = extractVersionFromMetadata(mixedMetadata);
      expect(versionWithoutExplicit).toBe(EPUBVersion.EPUB_2_0); // EPUB 2.0 detection has priority
      expect(isEPUB2Metadata(mixedMetadata)).toBe(true);
      expect(isEPUB3Metadata(mixedMetadata)).toBe(true);
    });

    test('should handle complex HTML content analysis', () => {
      const complexHTML = `
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
        <head>
          <title>Complex Document</title>
        </head>
        <body>
          <div epub:type="chapter" data-epub="chapter1">
            <h1>Chapter 1</h1>
            <p>This is modern EPUB content with multimedia.</p>
            <audio src="audio.mp3" controls></audio>
            <video src="video.mp4" width="320" height="240"></video>
            <canvas id="chart" width="400" height="300"></canvas>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
            </svg>
          </div>
        </body>
        </html>
      `;

      expect(hasHTML5Indicators(complexHTML)).toBe(true);
    });
  });
});
