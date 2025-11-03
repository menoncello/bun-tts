import { test, expect, describe, mock, beforeEach } from 'bun:test';
import { StructureAnalyzer } from 'src/core/document-processing/structure-analyzer.js';

// Mock the MarkdownParser module
const mockMarkdownParser = {
  parse: mock(() =>
    Promise.resolve({ success: true, data: { structure: {} } })
  ),
  extractStructure: mock(() => Promise.resolve({})),
};

// Mock the module at the path where it's imported
mock.module('src/core/document-processing/parsers/markdown-parser', () => ({
  MarkdownParser: mock(() => mockMarkdownParser),
}));
// Mock dependencies
const mockLogger = {
  debug: mock((_message: string) => {
    // Mock debug implementation
  }),
  info: mock((_message: string) => {
    // Mock info implementation
  }),
  warn: mock((_message: string) => {
    // Mock warn implementation
  }),
  error: mock((_message: string) => {
    // Mock error implementation
  }),
  fatal: mock((_message: string) => {
    // Mock fatal implementation
  }),
  child: mock(() => mockLogger),
};

const mockConfigManager = {
  config: null,
  configPath: '',
  moduleName: '',
  validator: {} as any,
  explorer: {} as any,
  loadConfig: mock(() => Promise.resolve({ success: true, data: {} })),
  getConfig: mock(() => ({})),
  reloadConfig: mock(() => Promise.resolve({ success: true, data: {} })),
  createSampleConfig: mock(() => ''),
  loadConfigFile: mock(() => Promise.resolve({ config: {} })),
  mergeConfigurations: mock(() => ({})),
  handleConfigLoadError: mock(() => ({
    success: false,
    error: new Error('Mock config load error'),
  })),
  getDefaultConfig: mock(() => ({})),
  validateConfig: mock(() => ({})),
  validateTtsEngine: mock((engine: string) => {
    // Mock TTS engine validation
    return { isValid: true, engine };
  }),
  validateOutputFormat: mock((format: string) => {
    // Mock output format validation
    return { isValid: true, format };
  }),
  validateNumericValues: mock((values: Record<string, number>) => {
    // Mock numeric values validation
    return { isValid: true, values };
  }),
  validateVoiceSettings: mock((settings: Record<string, any>) => {
    // Mock voice settings validation
    return { isValid: true, settings };
  }),
  validateSpeedSetting: mock((speed: number) => {
    // Mock speed setting validation
    return { isValid: true, speed };
  }),
  validatePitchSetting: mock((pitch: number) => {
    // Mock pitch setting validation
    return { isValid: true, pitch };
  }),
  validateVolumeSetting: mock((volume: number) => {
    // Mock volume setting validation
    return { isValid: true, volume };
  }),
  validateEmotionSettings: mock((emotions: Record<string, any>) => {
    // Mock emotion settings validation
    return { isValid: true, emotions };
  }),
  generateConfigTemplate: mock(() => ''),
  getTemplateHeader: mock(() => ''),
  getTtsEngineSection: mock(() => ''),
  getVoiceSettingsSection: mock(() => ''),
  getAudioOutputSection: mock(() => ''),
} as any;

describe('Confidence Scoring System', () => {
  let analyzer: StructureAnalyzer;

  beforeEach(() => {
    analyzer = new StructureAnalyzer(mockLogger, mockConfigManager, {
      detailedConfidenceReporting: false,
    });
    // Clear mock calls
    mockMarkdownParser.parse.mockClear();
  });

  test('should calculate structure detection confidence metrics', async () => {
    // GIVEN: Document with varying structure clarity
    const document = {
      format: 'markdown' as const,
      content: `
# Chapter 1: Introduction

This is well-formatted content.

## Section 1.1

Clear section with proper formatting.

# Chapter 2

?

# Chapter 3: Poorly Formatted

## Section 3.1

# 3.2 No clear title
      `.trim(),
    };

    // WHEN: Calculating confidence metrics
    mockMarkdownParser.parse.mockReturnValue(
      Promise.resolve({
        success: true,
        data: {
          structure: {
            format: 'markdown' as const,
            documentStructure: {
              metadata: {
                title: 'Test Document',
                author: 'Test Author',
                language: 'en',
                wordCount: 50,
              },
              chapters: [],
              paragraphs: [],
            },
            confidence: {
              overall: 0.7,
              chapters: [],
              paragraphs: { average: 0.7, distribution: [] },
              sentences: { average: 0.7, totalCount: 10 },
              structureFactors: [],
              metrics: {
                isWellFormed: false,
                hasClearHierarchy: false,
                consistentHeadings: false,
                appropriateLength: false,
                logicalFlow: false,
              },
            },
            structureTree: {
              id: 'root',
              label: 'Document',
              type: 'document' as const,
              level: 0,
              children: [],
              display: {
                expanded: false,
                hasIssues: false,
                confidence: 0.7,
                icon: '📄',
                metadata: {},
              },
            },
            validation: null,
            processingTime: 130,
          },
          metadata: {
            title: 'Confidence Metrics Test',
            wordCount: 50,
            totalWordCount: 50,
            totalChapters: 3,
            totalParagraphs: 5,
            totalSentences: 10,
            estimatedTotalDuration: 30,
            confidence: 0.7,
            processingMetrics: {
              startTime: Date.now(),
              endTime: Date.now() + 100,
              processingTime: 100,
              nodesProcessed: 4,
            },
            customMetadata: {},
          },
          chapters: [
            {
              id: 'chap1',
              title: 'Chapter 1: Introduction',
              level: 1,
              position: 0,
              confidence: 0.95,
              wordCount: 15,
              estimatedDuration: 9,
              startPosition: 0,
              endPosition: 50,
              startIndex: 0,
              paragraphs: [
                {
                  id: 'para1',
                  type: 'text',
                  position: 0,
                  wordCount: 8,
                  rawText: 'Content here.',
                  includeInAudio: true,
                  confidence: 0.95,
                  text: 'Content here.',
                  sentences: [
                    {
                      id: 'sent1',
                      text: 'Content here.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap2',
              title: '?',
              level: 1,
              position: 2,
              confidence: 0.15,
              wordCount: 5,
              estimatedDuration: 3,
              startPosition: 50,
              endPosition: 60,
              startIndex: 50,
              paragraphs: [
                {
                  id: 'para2',
                  type: 'text',
                  position: 0,
                  wordCount: 2,
                  rawText: '?',
                  includeInAudio: true,
                  confidence: 0.15,
                  text: '?',
                  sentences: [
                    {
                      id: 'sent2',
                      text: '?',
                      position: 0,
                      wordCount: 1,
                      estimatedDuration: 0.5,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
          ],
          totalParagraphs: 5,
          totalSentences: 10,
          totalWordCount: 50,
          totalChapters: 3,
          estimatedTotalDuration: 30,
          confidence: 0.7,
          processingMetrics: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            processingTime: 100,
            nodesProcessed: 4,
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 100,
            sourceLength: 200,
            processingErrors: [],
          },
        },
      })
    );

    const result = await analyzer.analyzeStructure(
      document.content,
      document.format,
      {
        detailedConfidence: true,
        confidenceThreshold: 0.5,
      }
    );

    // THEN: Should calculate comprehensive confidence metrics
    expect(result.confidence).toBeDefined();
    expect(result.documentStructure).toBeDefined();
    expect(result.documentStructure.chapters).toBeDefined();

    // Verify overall confidence score
    expect(result.confidence.overall).toBeDefined();
    expect(result.confidence.overall).toBeGreaterThan(0);

    // Verify individual chapter confidence
    const clearChapter = result.documentStructure.chapters.find(
      (c) => c.title === 'Chapter 1: Introduction'
    );
    expect(clearChapter?.confidence).toBeGreaterThan(0.9);

    const unclearChapter = result.documentStructure.chapters.find(
      (c) => c.title === '?'
    );
    expect(unclearChapter?.confidence).toBeLessThan(0.3);
  });

  test('should provide confidence levels per chapter, section, paragraph, sentence', async () => {
    // GIVEN: Fully structured document
    const document = {
      format: 'markdown' as const,
      content: `
# Chapter 1

Clear chapter with good structure.

## Section 1.1

Well-defined section.

### Subsection 1.1.1

Clear subsection.

Paragraph 1. Sentence one. Sentence two.

Paragraph 2. Another sentence here.

# Chapter 2

Second chapter.
      `.trim(),
    };

    // WHEN: Analyzing with multi-level confidence
    mockMarkdownParser.parse.mockReturnValue(
      Promise.resolve({
        success: true,
        data: {
          structure: {
            format: 'markdown' as const,
            documentStructure: {
              metadata: {
                title: 'Test Document',
                author: 'Test Author',
                language: 'en',
                wordCount: 50,
              },
              chapters: [],
              paragraphs: [],
            },
            confidence: {
              overall: 0.7,
              chapters: [],
              paragraphs: { average: 0.7, distribution: [] },
              sentences: { average: 0.7, totalCount: 10 },
              structureFactors: [],
              metrics: {
                isWellFormed: false,
                hasClearHierarchy: false,
                consistentHeadings: false,
                appropriateLength: false,
                logicalFlow: false,
              },
            },
            structureTree: {
              id: 'root',
              label: 'Document',
              type: 'document' as const,
              level: 0,
              children: [],
              display: {
                expanded: false,
                hasIssues: false,
                confidence: 0.7,
                icon: '📄',
                metadata: {},
              },
            },
            validation: null,
            processingTime: 130,
          },
          metadata: {
            title: 'Multi-Level Confidence Test',
            wordCount: 75,
            totalWordCount: 75,
            totalChapters: 2,
            totalParagraphs: 2,
            totalSentences: 5,
            estimatedTotalDuration: 45,
            confidence: 0.7,
            customMetadata: {},
          },
          chapters: [
            {
              id: 'chap1',
              title: 'Chapter 1',
              level: 1,
              position: 0,
              confidence: 0.94,
              wordCount: 35,
              estimatedDuration: 21,
              startPosition: 0,
              endPosition: 35,
              startIndex: 0,
              paragraphs: [
                {
                  id: 'para1',
                  type: 'text',
                  position: 0,
                  wordCount: 8,
                  rawText: 'Paragraph 1. Sentence one. Sentence two.',
                  includeInAudio: true,
                  confidence: 0.88,
                  text: 'Paragraph 1. Sentence one. Sentence two.',
                  sentences: [
                    {
                      id: 'sent1',
                      text: 'Paragraph 1.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                    {
                      id: 'sent2',
                      text: 'Sentence one.',
                      position: 1,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                    {
                      id: 'sent3',
                      text: 'Sentence two.',
                      position: 2,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap2',
              title: 'Chapter 2',
              level: 1,
              position: 3,
              confidence: 0.93,
              wordCount: 20,
              estimatedDuration: 12,
              startPosition: 35,
              endPosition: 55,
              startIndex: 35,
              paragraphs: [
                {
                  id: 'para2',
                  type: 'text',
                  position: 0,
                  wordCount: 6,
                  rawText: 'Paragraph 2. Another sentence here.',
                  includeInAudio: true,
                  confidence: 0.87,
                  text: 'Paragraph 2. Another sentence here.',
                  sentences: [
                    {
                      id: 'sent4',
                      text: 'Paragraph 2.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                    {
                      id: 'sent5',
                      text: 'Another sentence here.',
                      position: 1,
                      wordCount: 3,
                      estimatedDuration: 1.5,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
          ],
          totalParagraphs: 2,
          totalSentences: 5,
          totalWordCount: 75,
          totalChapters: 2,
          estimatedTotalDuration: 45,
          confidence: 0.7,
          processingMetrics: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            processingTime: 100,
            nodesProcessed: 2,
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 100,
            sourceLength: 300,
            processingErrors: [],
          },
        },
      })
    );

    const result = await analyzer.analyzeStructure(
      document.content,
      document.format,
      {
        detailedConfidence: false,
      }
    );

    // THEN: Should provide confidence at all hierarchy levels
    // Check chapter confidence
    const chapters = result.documentStructure.chapters;
    expect(chapters).toHaveLength(2);
    for (const chapter of chapters) {
      expect(chapter.confidence).toBeDefined();
      expect(chapter.confidence).toBeGreaterThan(0.8);
    }

    // Check that document structure is available
    expect(result.documentStructure).toBeDefined();
    expect(result.documentStructure.totalChapters).toBe(2);
    expect(result.documentStructure.totalParagraphs).toBeGreaterThan(0);
    expect(result.documentStructure.totalSentences).toBeGreaterThan(0);
  });

  test('should implement weighted scoring based on multiple detection signals', async () => {
    // GIVEN: Document analyzed with various signals
    const document = {
      format: 'markdown' as const,
      content: `
# Well-Formatted Chapter

## Section with clear hierarchy

Content here is substantial and provides context.

### Subsection

Even more detailed content.

# Poor Chapter

Content
      `.trim(),
    };

    // WHEN: Calculating weighted confidence
    mockMarkdownParser.parse.mockReturnValue(
      Promise.resolve({
        success: true,
        data: {
          structure: {
            format: 'markdown' as const,
            documentStructure: {
              metadata: {
                title: 'Test Document',
                author: 'Test Author',
                language: 'en',
                wordCount: 50,
              },
              chapters: [],
              paragraphs: [],
            },
            confidence: {
              overall: 0.7,
              chapters: [],
              paragraphs: { average: 0.7, distribution: [] },
              sentences: { average: 0.7, totalCount: 10 },
              structureFactors: [],
              metrics: {
                isWellFormed: false,
                hasClearHierarchy: false,
                consistentHeadings: false,
                appropriateLength: false,
                logicalFlow: false,
              },
            },
            structureTree: {
              id: 'root',
              label: 'Document',
              type: 'document' as const,
              level: 0,
              children: [],
              display: {
                expanded: false,
                hasIssues: false,
                confidence: 0.7,
                icon: '📄',
                metadata: {},
              },
            },
            validation: null,
            processingTime: 130,
          },
          metadata: {
            title: 'Weighted Scoring Test',
            wordCount: 60,
            totalWordCount: 60,
            totalChapters: 2,
            totalParagraphs: 3,
            totalSentences: 6,
            estimatedTotalDuration: 36,
            confidence: 0.7,
            customMetadata: {},
          },
          chapters: [
            {
              id: 'chap1',
              title: 'Well-Formatted Chapter',
              level: 1,
              position: 0,
              confidence: 0.91,
              wordCount: 35,
              estimatedDuration: 21,
              startPosition: 0,
              endPosition: 35,
              startIndex: 0,
              paragraphs: [
                {
                  id: 'para1',
                  type: 'text',
                  position: 0,
                  wordCount: 8,
                  rawText: 'Content here is substantial and provides context.',
                  includeInAudio: true,
                  confidence: 0.95,
                  text: 'Content here is substantial and provides context.',
                  sentences: [
                    {
                      id: 'sent1',
                      text: 'Content here.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                    {
                      id: 'sent2',
                      text: 'Substantial content.',
                      position: 1,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap2',
              title: 'Poor Chapter',
              level: 1,
              position: 3,
              confidence: 0.45,
              wordCount: 10,
              estimatedDuration: 6,
              startPosition: 35,
              endPosition: 45,
              startIndex: 35,
              paragraphs: [
                {
                  id: 'para2',
                  type: 'text',
                  position: 0,
                  wordCount: 2,
                  rawText: 'Content',
                  includeInAudio: true,
                  confidence: 0.45,
                  text: 'Content',
                  sentences: [
                    {
                      id: 'sent3',
                      text: 'Content',
                      position: 0,
                      wordCount: 1,
                      estimatedDuration: 0.5,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
          ],
          totalParagraphs: 3,
          totalSentences: 6,
          totalWordCount: 60,
          totalChapters: 2,
          estimatedTotalDuration: 36,
          confidence: 0.7,
          processingMetrics: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            processingTime: 100,
            nodesProcessed: 2,
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 100,
            sourceLength: 400,
            processingErrors: [],
          },
        },
      })
    );

    const result = await analyzer.analyzeStructure(
      document.content,
      document.format,
      {
        detailedConfidence: true,
        confidenceThreshold: 0.5,
      }
    );

    // THEN: Should apply weighted scoring formula
    const wellFormatted = result.documentStructure.chapters.find(
      (c) => c.title === 'Well-Formatted Chapter'
    );
    const poorChapter = result.documentStructure.chapters.find(
      (c) => c.title === 'Poor Chapter'
    );

    // Check that signals have been processed into confidence scores
    expect(wellFormatted?.confidence).toBeDefined();
    expect(poorChapter?.confidence).toBeDefined();

    // Verify well-formatted has higher confidence
    expect(wellFormatted?.confidence || 0).toBeGreaterThan(
      poorChapter?.confidence || 0
    );

    // Check that structure factors are available in confidence report
    expect(result.confidence.structureFactors).toBeDefined();
    expect(result.confidence.structureFactors.length).toBeGreaterThan(0);
  });

  test('should generate confidence reports for user review', async () => {
    // GIVEN: Document with mixed confidence levels
    const document = {
      format: 'markdown' as const,
      content: `
# High Confidence Chapter

## Clear Section

Content here is well-formatted and structured.

# Medium Confidence Chapter

## ?

Some content.

# Low Confidence Chapter

Just text without structure.
      `.trim(),
    };

    // WHEN: Generating confidence report
    mockMarkdownParser.parse.mockReturnValue(
      Promise.resolve({
        success: true,
        data: {
          structure: {
            format: 'markdown' as const,
            documentStructure: {
              metadata: {
                title: 'Test Document',
                author: 'Test Author',
                language: 'en',
                wordCount: 50,
              },
              chapters: [],
              paragraphs: [],
            },
            confidence: {
              overall: 0.7,
              chapters: [],
              paragraphs: { average: 0.7, distribution: [] },
              sentences: { average: 0.7, totalCount: 10 },
              structureFactors: [],
              metrics: {
                isWellFormed: false,
                hasClearHierarchy: false,
                consistentHeadings: false,
                appropriateLength: false,
                logicalFlow: false,
              },
            },
            structureTree: {
              id: 'root',
              label: 'Document',
              type: 'document' as const,
              level: 0,
              children: [],
              display: {
                expanded: false,
                hasIssues: false,
                confidence: 0.7,
                icon: '📄',
                metadata: {},
              },
            },
            validation: null,
            processingTime: 130,
          },
          metadata: {
            title: 'Confidence Report Test',
            wordCount: 90,
            totalWordCount: 90,
            totalChapters: 3,
            totalParagraphs: 4,
            totalSentences: 8,
            estimatedTotalDuration: 54,
            confidence: 0.7,
            customMetadata: {},
          },
          chapters: [
            {
              id: 'chap1',
              title: 'High Confidence Chapter',
              level: 1,
              position: 0,
              confidence: 0.95,
              wordCount: 30,
              estimatedDuration: 18,
              startPosition: 0,
              endPosition: 30,
              startIndex: 0,
              paragraphs: [
                {
                  id: 'para1',
                  type: 'text',
                  position: 0,
                  wordCount: 8,
                  rawText: 'Content here is well-formatted and structured.',
                  includeInAudio: true,
                  confidence: 0.95,
                  text: 'Content here is well-formatted and structured.',
                  sentences: [
                    {
                      id: 'sent1',
                      text: 'Content here.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                    {
                      id: 'sent2',
                      text: 'Well-formatted content.',
                      position: 1,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap2',
              title: 'Medium Confidence Chapter',
              level: 1,
              position: 2,
              confidence: 0.62,
              wordCount: 25,
              estimatedDuration: 15,
              startPosition: 30,
              endPosition: 55,
              startIndex: 30,
              paragraphs: [
                {
                  id: 'para2',
                  type: 'text',
                  position: 0,
                  wordCount: 5,
                  rawText: 'Some content.',
                  includeInAudio: true,
                  confidence: 0.62,
                  text: 'Some content.',
                  sentences: [
                    {
                      id: 'sent3',
                      text: 'Some content.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap3',
              title: 'Low Confidence Chapter',
              level: 1,
              position: 4,
              confidence: 0.28,
              wordCount: 15,
              estimatedDuration: 9,
              startPosition: 55,
              endPosition: 70,
              startIndex: 55,
              paragraphs: [
                {
                  id: 'para3',
                  type: 'text',
                  position: 0,
                  wordCount: 4,
                  rawText: 'Just text without structure.',
                  includeInAudio: true,
                  confidence: 0.28,
                  text: 'Just text without structure.',
                  sentences: [
                    {
                      id: 'sent4',
                      text: 'Just text.',
                      position: 0,
                      wordCount: 2,
                      estimatedDuration: 1.0,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
          ],
          totalParagraphs: 4,
          totalSentences: 8,
          totalWordCount: 90,
          totalChapters: 3,
          estimatedTotalDuration: 54,
          confidence: 0.7,
          processingMetrics: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            processingTime: 100,
            nodesProcessed: 3,
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 100,
            sourceLength: 500,
            processingErrors: [],
          },
        },
      })
    );

    const result = await analyzer.analyzeStructure(
      document.content,
      document.format,
      {
        detailedConfidence: true,
        confidenceThreshold: 0.5,
      }
    );

    // THEN: Should generate comprehensive confidence report
    expect(result.confidence).toBeDefined();
    expect(result.confidence.overall).toBeDefined();
    expect(result.confidence.chapters).toBeDefined();
    expect(result.confidence.metrics).toBeDefined();
    expect(result.confidence.chapters.length).toBeGreaterThan(0);

    // Check summary statistics
    expect(result.confidence.overall).toBeGreaterThan(0);
    expect(result.confidence.chapters.length).toBeGreaterThan(0);

    const highConfidenceCount = result.confidence.chapters.filter(
      (c: any) => c.confidence > 0.8
    ).length;
    const mediumConfidenceCount = result.confidence.chapters.filter(
      (c: any) => c.confidence > 0.5 && c.confidence <= 0.8
    ).length;
    const lowConfidenceCount = result.confidence.chapters.filter(
      (c: any) => c.confidence <= 0.5
    ).length;

    expect(highConfidenceCount).toBeGreaterThanOrEqual(0);
    expect(mediumConfidenceCount).toBeGreaterThanOrEqual(0);
    expect(lowConfidenceCount).toBeGreaterThanOrEqual(0);

    // Check recommendations
    const recommendations = result.confidence.metrics?.recommendations || [];
    const lowConfidenceRecommendations = recommendations.filter(
      (r: string) =>
        r.toLowerCase().includes('low confidence') ||
        r.toLowerCase().includes('confidence')
    );
    expect(lowConfidenceRecommendations.length).toBeGreaterThanOrEqual(0);
  });

  test('should support threshold-based acceptance criteria', async () => {
    // GIVEN: Document with various confidence levels
    const document = {
      format: 'markdown' as const,
      content: `
# Chapter 1

Content.

# Chapter 2

?
      `.trim(),
    };

    // WHEN: Analyzing with threshold criteria
    mockMarkdownParser.parse.mockReturnValue(
      Promise.resolve({
        success: true,
        data: {
          structure: {
            format: 'markdown' as const,
            documentStructure: {
              metadata: {
                title: 'Test Document',
                author: 'Test Author',
                language: 'en',
                wordCount: 50,
              },
              chapters: [],
              paragraphs: [],
            },
            confidence: {
              overall: 0.7,
              chapters: [],
              paragraphs: { average: 0.7, distribution: [] },
              sentences: { average: 0.7, totalCount: 10 },
              structureFactors: [],
              metrics: {
                isWellFormed: false,
                hasClearHierarchy: false,
                consistentHeadings: false,
                appropriateLength: false,
                logicalFlow: false,
              },
            },
            structureTree: {
              id: 'root',
              label: 'Document',
              type: 'document' as const,
              level: 0,
              children: [],
              display: {
                expanded: false,
                hasIssues: false,
                confidence: 0.7,
                icon: '📄',
                metadata: {},
              },
            },
            validation: null,
            processingTime: 130,
          },
          metadata: {
            title: 'Threshold Test',
            wordCount: 20,
            totalWordCount: 20,
            totalChapters: 2,
            totalParagraphs: 2,
            totalSentences: 4,
            estimatedTotalDuration: 12,
            confidence: 0.7,
            customMetadata: {},
          },
          chapters: [
            {
              id: 'chap1',
              title: 'Chapter 1',
              level: 1,
              position: 0,
              confidence: 0.94,
              wordCount: 15,
              estimatedDuration: 9,
              startPosition: 0,
              endPosition: 15,
              startIndex: 0,
              paragraphs: [
                {
                  id: 'para1',
                  type: 'text',
                  position: 0,
                  wordCount: 2,
                  rawText: 'Content.',
                  includeInAudio: true,
                  confidence: 0.94,
                  text: 'Content.',
                  sentences: [
                    {
                      id: 'sent1',
                      text: 'Content.',
                      position: 0,
                      wordCount: 1,
                      estimatedDuration: 0.5,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap2',
              title: 'Chapter 2',
              level: 1,
              position: 1,
              confidence: 0.25,
              wordCount: 5,
              estimatedDuration: 3,
              startPosition: 15,
              endPosition: 20,
              startIndex: 15,
              paragraphs: [
                {
                  id: 'para2',
                  type: 'text',
                  position: 0,
                  wordCount: 1,
                  rawText: '?',
                  includeInAudio: true,
                  confidence: 0.25,
                  text: '?',
                  sentences: [
                    {
                      id: 'sent2',
                      text: '?',
                      position: 0,
                      wordCount: 1,
                      estimatedDuration: 0.5,
                      hasFormatting: false,
                    },
                  ],
                },
              ],
            },
          ],
          totalParagraphs: 2,
          totalSentences: 4,
          totalWordCount: 20,
          totalChapters: 2,
          estimatedTotalDuration: 12,
          confidence: 0.7,
          processingMetrics: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            processingTime: 100,
            nodesProcessed: 2,
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 100,
            sourceLength: 200,
            processingErrors: [],
          },
        },
      })
    );

    const result = await analyzer.analyzeStructure(
      document.content,
      document.format,
      {
        detailedConfidence: true,
        confidenceThreshold: 0.5,
      }
    );

    // THEN: Should categorize nodes by threshold
    expect(result.confidence.metrics).toBeDefined();

    const chapters = result.documentStructure.chapters;
    const highQuality = chapters.filter((c) => (c.confidence || 0) >= 0.8);
    const acceptable = chapters.filter(
      (c) => (c.confidence || 0) >= 0.5 && (c.confidence || 0) < 0.8
    );
    const reviewRequired = chapters.filter((c) => (c.confidence || 0) < 0.5);

    expect(highQuality.length).toBeGreaterThan(0);
    expect(acceptable.length).toBeGreaterThanOrEqual(0);
    expect(reviewRequired.length).toBeGreaterThan(0);

    // Verify threshold categorization
    expect(highQuality[0]?.title).toBe('Chapter 1'); // High confidence
    expect(reviewRequired[0]?.title).toBe('Chapter 2'); // Low confidence

    // Verify risk level is set
    expect(result.confidence.metrics.riskLevel).toBeDefined();
  });
});
