import { describe, test, expect, mock } from 'bun:test';
import { EPUBVersion } from '../../../../src/core/document-processing/parsers/epub-parser-compatibility.js';
import { analyzeContentCompatibility } from '../../../../src/core/document-processing/parsers/epub-parser-content-analysis.js';

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

describe('EPUB Parser Content Analysis', () => {
  describe('analyzeContentCompatibility', () => {
    test('should analyze EPUB 2.0 content and find media incompatibility', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head><title>Chapter 1</title></head>
            <body>
              <p>Chapter content here.</p>
              <audio src="audio.mp3" controls>
                Your browser does not support the audio element.
              </audio>
              <video src="video.mp4" width="320" height="240" controls>
                Your browser does not support the video tag.
              </video>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
      expect(mockEpub.getSpineItems).toHaveBeenCalled();
      expect(mockEpub.readXhtmlItemContents).toHaveBeenCalledWith(
        'chapter1',
        'text'
      );
    });

    test('should analyze EPUB 2.0 content and find script incompatibility', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <title>Chapter 1</title>
              <script type="text/javascript">
                console.log('This script should not be in EPUB 2.0');
              </script>
            </head>
            <body>
              <p>Content with script:</p>
              <script src="interactive.js"></script>
              <button onclick="doSomething()">Click me</button>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('script_removal');
    });

    test('should find both media and script incompatibility in EPUB 2.0', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <script>alert('Test');</script>
            </head>
            <body>
              <p>Content with both issues:</p>
              <video src="test.mp4"></video>
              <script>console.log('more script');</script>
              <audio src="test.mp3"></audio>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toHaveLength(2);
      expect(requiredFallbacks).toContain('media_content_filtering');
      expect(requiredFallbacks).toContain('script_removal');
    });

    test('should not report issues for compatible EPUB 2.0 content', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head><title>Compatible Chapter</title></head>
            <body>
              <h1>Chapter Title</h1>
              <p>This is standard EPUB 2.0 compatible content.</p>
              <img src="image.jpg" alt="Description" />
              <table>
                <tr><td>Cell 1</td><td>Cell 2</td></tr>
              </table>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should skip content analysis for EPUB 3.0+ versions', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html xmlns="http://www.w3.org/1999/xhtml">
            <body>
              <video src="video.mp4"></video>
              <script>console.log('script');</script>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_3_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
      expect(mockEpub.getSpineItems).toHaveBeenCalled();
      // Note: The function still reads content even for EPUB 3.0+ versions
      expect(mockEpub.readXhtmlItemContents).toHaveBeenCalled();
    });

    test('should handle multiple spine items with sampling', async () => {
      const spineItems = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `chapter${i + 1}`,
          href: `chapter${i + 1}.xhtml`,
          mediaType: 'application/xhtml+xml',
        }));

      const mockEpub = {
        getSpineItems: mock(() => Promise.resolve(spineItems)),
        readXhtmlItemContents: mock((itemId: string) => {
          const index = Number.parseInt(itemId.replace('chapter', '')) - 1;
          if (index < 5) {
            // First few items have incompatible content
            return Promise.resolve(`
              <html>
                <body>
                  <video src="video${index}.mp4"></video>
                  <script>console.log('script ${index}');</script>
                </body>
              </html>
            `);
          }
          // Later items are compatible
          return Promise.resolve(`
            <html>
              <body>
                <p>Compatible content ${index}</p>
              </body>
            </html>
          `);
        }),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      // Should find issues in the sampled items
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
      expect(requiredFallbacks).toContain('script_removal');

      // Should only sample the first few items (CONTENT_ANALYSIS_SAMPLE_SIZE)
      expect(mockEpub.readXhtmlItemContents).toHaveBeenCalledTimes(3); // CONTENT_ANALYSIS_SAMPLE_SIZE = 3
    });

    test('should handle empty spine items array', async () => {
      const mockEpub = {
        getSpineItems: mock(() => Promise.resolve([])),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
      expect(mockEpub.getSpineItems).toHaveBeenCalled();
    });

    test('should handle null spine items', async () => {
      const mockEpub = {
        getSpineItems: mock(() => Promise.resolve(null)),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should handle getSpineItems throwing error', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.reject(new Error('Spine access error'))
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      // The function handles errors silently and doesn't add the warning
      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should handle readXhtmlItemContents throwing error', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.reject(new Error('Read error'))
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0); // Errors are silently handled
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should handle readXhtmlItemContents returning null', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() => Promise.resolve(null)),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should handle individual item analysis errors gracefully', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
            {
              id: 'chapter2',
              href: 'chapter2.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock((itemId: string) => {
          if (itemId === 'chapter1') {
            return Promise.reject(new Error('Chapter 1 error'));
          }
          return Promise.resolve(`
            <html>
              <body>
                <video src="video.mp4"></video>
              </body>
            </html>
          `);
        }),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      // Should still analyze the second item successfully
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
    });

    test('should handle malformed spine items', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            { id: 'chapter1' }, // Missing href
            null, // Null item
            undefined, // Undefined item
            { id: 'chapter2', href: 'chapter2.xhtml' }, // Valid item
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <script>console.log('test');</script>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('script_removal');
    });

    test('should handle EPUB 3.1 version', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <video src="video.mp4"></video>
              <script>console.log('script');</script>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_3_1,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
    });

    test('should handle EPUB 3.2 version', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() => Promise.resolve('<p>Content</p>')),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_3_2,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(0);
      expect(requiredFallbacks).toHaveLength(0);
      expect(mockEpub.readXhtmlItemContents).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle content with various media tag formats', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <!-- Various audio tag formats -->
              <audio src="audio.mp3"></audio>
              <audio>
                <source src="audio.ogg" type="audio/ogg">
                <source src="audio.mp3" type="audio/mpeg">
              </audio>

              <!-- Various video tag formats -->
              <video src="video.mp4" width="320" height="240"></video>
              <video controls>
                <source src="movie.webm" type="video/webm">
                <source src="movie.ogg" type="video/ogg">
              </video>

              <!-- Self-closing tags -->
              <audio src="sound.mp3" />
              <video src="movie.mp4" width="400" />
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
    });

    test('should handle content with various script tag formats', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <head>
              <script type="text/javascript">var x = 1;</script>
              <script src="external.js"></script>
            </head>
            <body>
              <script>
                function test() { return true; }
              </script>
              <script language="javascript">
                alert('Hello');
              </script>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('script_removal');
    });

    test('should handle content with case-sensitive tag detection', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <audio src="audio.mp3"></audio>
              <script>alert('test');</script>
              <video src="video.mp4"></video>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
    });

    test('should handle content with comments containing problematic tags', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <!-- This is a comment with <video> tags that should be ignored -->
              <!-- <audio src="audio.mp3"></audio> -->
              <p>Actual content with real video:</p>
              <video src="real-video.mp4"></video>
              <!-- <script>alert('commented script');</script> -->
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      // Should still detect the real video tag (not in comments)
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
    });

    test('should handle very large content files', async () => {
      const largeContent = `
        <html>
          <body>
            ${'<p>Large content paragraph.</p>'.repeat(1000)}
            <video src="large-video.mp4"></video>
            ${'<p>More content.</p>'.repeat(1000)}
            <script>console.log('script in large file');</script>
          </body>
        </html>
      `;

      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() => Promise.resolve(largeContent)),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
    });

    test('should handle content with CDATA sections', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([{ id: 'chapter1', href: 'chapter1.xhtml' }])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <html>
            <body>
              <script>
                //<![CDATA[
                console.log('<video>This looks like a video but is in a string</video>');
                //]]>
              </script>
              <video src="real-video.mp4"></video>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      // Should detect both the script tag and the real video tag
      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle realistic EPUB 2.0 content structure', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'toc',
              href: 'toc.xhtml',
              mediaType: 'application/xhtml+xml',
            },
            {
              id: 'chapter1',
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
            {
              id: 'chapter2',
              href: 'chapter2.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock((itemId: string) => {
          if (itemId === 'toc') {
            return Promise.resolve(`
              <html xmlns="http://www.w3.org/1999/xhtml">
                <head><title>Table of Contents</title></head>
                <body>
                  <nav>
                    <ul>
                      <li><a href="chapter1.xhtml">Chapter 1</a></li>
                      <li><a href="chapter2.xhtml">Chapter 2</a></li>
                    </ul>
                  </nav>
                </body>
              </html>
            `);
          } else if (itemId === 'chapter1') {
            return Promise.resolve(`
              <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <title>Chapter 1</title>
                  <script type="text/javascript">
                    function initChapter() {
                      console.log('Chapter 1 initialized');
                    }
                  </script>
                </head>
                <body>
                  <h1>Chapter 1: Introduction</h1>
                  <p>Welcome to the first chapter.</p>
                  <audio src="intro-music.mp3" controls>
                    Your browser does not support the audio element.
                  </audio>
                </body>
              </html>
            `);
          }
          return Promise.resolve(`
              <html xmlns="http://www.w3.org/1999/xhtml">
                <head><title>Chapter 2</title></head>
                <body>
                  <h1>Chapter 2: Main Content</h1>
                  <p>This chapter has standard EPUB 2.0 content.</p>
                  <img src="image1.jpg" alt="Chapter image" />
                  <table>
                    <tr><th>Header 1</th><th>Header 2</th></tr>
                    <tr><td>Cell 1</td><td>Cell 2</td></tr>
                  </table>
                </body>
              </html>
            `);
        }),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
      expect(requiredFallbacks).toContain('script_removal');
    });

    test('should handle complex nested content structure', async () => {
      const mockEpub = {
        getSpineItems: mock(() =>
          Promise.resolve([
            {
              id: 'complex-chapter',
              href: 'complex.xhtml',
              mediaType: 'application/xhtml+xml',
            },
          ])
        ),
        readXhtmlItemContents: mock(() =>
          Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <title>Complex Chapter</title>
              <script type="text/javascript">
                // Complex script with multiple functions
                function init() {
                  setupAudio();
                  setupVideo();
                }
                function setupAudio() {
                  var audio = document.getElementById('audio1');
                  audio.play();
                }
                function setupVideo() {
                  var video = document.getElementById('video1');
                  video.play();
                }
              </script>
              <style>
                .content { margin: 1em; }
              </style>
            </head>
            <body onload="init()">
              <div class="content">
                <h1>Complex Content Structure</h1>
                <p>This chapter demonstrates complex content:</p>

                <div id="multimedia-section">
                  <h2>Multimedia Content</h2>
                  <audio id="audio1" src="background-music.mp3" controls="controls">
                    <p>Your browser does not support the audio element.</p>
                  </audio>

                  <video id="video1" src="demo-video.mp4" width="400" height="300" controls="controls">
                    <p>Your browser does not support the video tag.</p>
                  </video>
                </div>

                <div id="interactive-section">
                  <h2>Interactive Elements</h2>
                  <button onclick="playAudio()">Play Audio</button>
                  <button onclick="playVideo()">Play Video</button>

                  <script>
                    function playAudio() {
                      document.getElementById('audio1').play();
                    }
                    function playVideo() {
                      document.getElementById('video1').play();
                    }
                  </script>
                </div>
              </div>
            </body>
          </html>
        `)
        ),
      } as any;

      const warnings: string[] = [];
      const requiredFallbacks: string[] = [];

      await analyzeContentCompatibility(
        mockEpub,
        EPUBVersion.EPUB_2_0,
        warnings,
        requiredFallbacks
      );

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain(
        'Audio/Video content found in EPUB 2.0 - will be ignored'
      );
      expect(warnings).toContain(
        'JavaScript content found in EPUB 2.0 - will be stripped'
      );
      expect(requiredFallbacks).toContain('media_content_filtering');
      expect(requiredFallbacks).toContain('script_removal');
    });
  });
});
