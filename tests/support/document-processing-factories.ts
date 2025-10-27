/**
 * Test Data Factories for Document Processing Tests
 *
 * Provides factory functions for creating test data, reducing duplication
 * and improving maintainability across test files.
 */

import { mock } from 'bun:test';
import type { Logger } from '../../src/interfaces/logger.js';
import type { ConfigManager } from '../../src/config/config-manager.js';
import type { DocumentStructure } from '../../src/core/document-processing/types.js';
import type { MarkdownParserConfig } from '../../src/core/document-processing/config/markdown-parser-config.js';

/**
 * Factory for creating mock Logger instances
 */
export class MockLoggerFactory {
  static create(): Logger {
    return {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    } as any;
  }

  static createWithExpectations(): Logger & {
    debug: ReturnType<typeof mock>;
    info: ReturnType<typeof mock>;
    warn: ReturnType<typeof mock>;
    error: ReturnType<typeof mock>;
  } {
    return {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    } as any;
  }
}

/**
 * Factory for creating mock ConfigManager instances
 */
export class MockConfigManagerFactory {
  static createDefault(): ConfigManager {
    return {
      get: mock((key: string, defaultValue: unknown) => {
        if (key === 'markdownParser') {
          return MarkdownParserConfigFactory.createDefault();
        }
        return defaultValue;
      }),
      set: mock(() => {}),
      has: mock(() => true),
      clear: mock(() => {}),
    } as any;
  }

  static createCustom(config: Partial<MarkdownParserConfig>): ConfigManager {
    return {
      get: mock((key: string, defaultValue: unknown) => {
        if (key === 'markdownParser') {
          return MarkdownParserConfigFactory.createCustom(config);
        }
        return defaultValue;
      }),
      set: mock(() => {}),
      has: mock(() => true),
      clear: mock(() => {}),
    } as any;
  }

  static createEmpty(): ConfigManager {
    return {
      get: mock(() => ({})),
      set: mock(() => {}),
      has: mock(() => false),
      clear: mock(() => {}),
    } as any;
  }
}

/**
 * Factory for creating MarkdownParserConfig instances
 */
export class MarkdownParserConfigFactory {
  static createDefault(): MarkdownParserConfig {
    return {
      chapterDetectionPattern: '^#{1,6}\\s+(.+)$',
      confidenceThreshold: 0.8,
      enableStreaming: true,
      maxChunkSize: 50000,
      chapterHeaderLevels: [2],
      includeCodeBlocks: false,
      includeTables: false,
      includeBlockquotes: true,
      includeLists: true,
      errorHandlingStrategy: 'recover',
      enableDebugLogging: false,
      sentenceBoundaryPatterns: ['[.!?]+\\s+', '[.!?]\\s+[A-Z]', '\\n\\s*'],
      minSentenceLength: 5,
      maxSentenceLength: 500,
      maxFileSize: 10,
      languageRules: {
        language: 'en',
        sentencePatterns: ['[.!?]+\\s+', '[.!?]\\s+[A-Z]', '\\n\\s*'],
        abbreviations: ['Mr', 'Mrs', 'Dr', 'etc', 'e.g', 'i.e', 'vs'],
        quotes: { opening: ['"', "'"], closing: ['"', "'"] },
        formatting: {
          emphasis: 'tone',
          code: 'announce',
          links: 'describe',
          headings: 'describe',
        },
      },
    };
  }

  static createCustom(
    overrides: Partial<MarkdownParserConfig>
  ): MarkdownParserConfig {
    return {
      ...this.createDefault(),
      ...overrides,
    };
  }

  static createWithHighThreshold(): MarkdownParserConfig {
    return this.createCustom({
      confidenceThreshold: 0.99,
    });
  }

  static createWithStreamingDisabled(): MarkdownParserConfig {
    return this.createCustom({
      enableStreaming: false,
    });
  }

  static createWithAllContentIncluded(): MarkdownParserConfig {
    return this.createCustom({
      includeCodeBlocks: true,
      includeTables: true,
      includeBlockquotes: true,
      includeLists: true,
      chapterHeaderLevels: [1, 2, 3], // Include multiple header levels
    });
  }
}

/**
 * Factory for creating Markdown test content
 */
export class MarkdownContentFactory {
  static createSimpleDocument(): string {
    return `# Test Document

## Chapter 1

This is the first chapter. It contains multiple sentences.

## Chapter 2

This is the second chapter with different content.`;
  }

  static createComplexDocument(): string {
    return [
      this.createDocumentHeader(),
      this.createOverviewSection(),
      this.createGettingStartedSection(),
      this.createCodeExamplesSection(),
      this.createConfigurationSection(),
      this.createAdvancedFeaturesSection(),
      this.createTroubleshootingSection(),
      this.createBestPracticesSection(),
      this.createConclusionSection(),
    ].join('\n');
  }

  private static createDocumentHeader(): string {
    return `# Sample Technical Documentation`;
  }

  private static createOverviewSection(): string {
    return `## Overview

This document provides a comprehensive guide to our system architecture. It includes multiple chapters with various content types to test the parsing functionality thoroughly.`;
  }

  private static createGettingStartedSection(): string {
    return `## Getting Started

To get started with our system, you need to follow these steps:

1. Install the dependencies using your preferred package manager
2. Configure the required settings in the configuration file
3. Run the initialization script to set up your environment`;
  }

  private static createCodeExamplesSection(): string {
    return `## Code Examples

Here are some code examples to help you understand the implementation:

\`\`\`javascript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

async function fetchData(endpoint) {
  try {
    const response = await fetch(\`\${config.apiUrl}/\${endpoint}\`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
\`\`\``;
  }

  private static createConfigurationSection(): string {
    return `## Configuration Options

The system supports various configuration options. You can customize the behavior by modifying the config file:

- **timeout**: Request timeout in milliseconds
- **retries**: Number of retry attempts for failed requests
- **debug**: Enable debug logging for troubleshooting`;
  }

  private static createAdvancedFeaturesSection(): string {
    return `## Advanced Features

> **Note**: Advanced features require additional setup and configuration. Please refer to the advanced configuration guide for more details.

The advanced features include:

| Feature | Description | Status |
|---------|-------------|--------|
| Caching | Built-in caching mechanism | Stable |
| Logging | Comprehensive logging system | Stable |
| Monitoring | Real-time monitoring dashboard | Beta |`;
  }

  private static createTroubleshootingSection(): string {
    return `## Troubleshooting

### Common Issues

If you encounter issues with the system, here are some common solutions:

**Problem**: Connection timeout
**Solution**: Increase the timeout value in the configuration

**Problem**: Authentication failure
**Solution**: Verify your API credentials are correct

### Error Codes

The system uses standard HTTP status codes. Here are the most common ones:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Internal server error`;
  }

  private static createBestPracticesSection(): string {
    return `## Best Practices

Follow these best practices to ensure optimal performance:

1. Always handle errors gracefully in your code
2. Use appropriate timeout values for network requests
3. Implement proper logging for debugging and monitoring
4. Test your code thoroughly before deploying to production`;
  }

  private static createConclusionSection(): string {
    return `## Conclusion

This documentation should provide you with all the information needed to work with our system effectively. If you need additional help, please refer to our support resources or contact our team.

For more information, visit our website or check out the GitHub repository for code examples and community contributions.`;
  }

  static createMalformedDocument(): string {
    return `
# Test Document

## Chapter 1

This has unclosed code blocks:
\`\`\`javascript
function test() {
  console.log("hello");

## Chapter 2

This has malformed tables:
| Header 1 | Header 2
Cell 1   | Cell 2

## Chapter 3

This has malformed lists:
* Item 1
* Item 2
 Invalid indentation

## Chapter 4

Normal content to ensure parsing continues. This should work fine and be parsed correctly despite the issues in previous chapters.`;
  }

  static createHeadersOnlyDocument(): string {
    return `# Document Title

## Chapter 1

## Chapter 2

### Subsection

## Chapter 3`;
  }

  static createShortDocument(): string {
    return 'A';
  }

  static createEmptyDocument(): string {
    return '';
  }

  static createDocumentWithVariedElements(): string {
    return `# Complex Document

## Chapter 1

This paragraph has **bold** and *italic* text.

This is a code block:
\`\`\`javascript
const x = 1;
\`\`\`

> This is a blockquote with multiple sentences. It should be processed correctly.

* List item one
* List item two
* List item three

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
  }

  static createLargeDocument(repeatCount: number = 5): string {
    return this.createComplexDocument().repeat(repeatCount);
  }

  static createDocumentWithAbbreviations(): string {
    return `# Abbreviation Test

## Chapter 1

Dr. Smith went to the U.S.A. He met Mr. Johnson at 3 p.m. They discussed the project, etc.

## Chapter 2

The meeting was scheduled for 5 p.m. EST. Dr. Johnson from the U.K. joined via video call.`;
  }

  static createDocumentWithVariedSentenceEndings(): string {
    return `# Sentence Test

## Chapter 1

First sentence. Second sentence! Third sentence? Fourth sentence; fifth sentence.

Sixth sentence with line break.
Seventh sentence after break.`;
  }

  static createDocumentWithShortSentences(): string {
    return `# Test Document

## Chapter 1

Hi. Ok. No. Yes.`;
  }

  static createDocumentWithLongSentences(): string {
    const longSentence =
      'This is a very long sentence that exceeds the maximum length limit and should trigger a validation error because it contains way too many words without proper punctuation or sentence breaks to make it readable and suitable for text-to-speech processing applications.'.repeat(
        2
      );

    return `# Test Document

## Chapter 1

${longSentence}`;
  }
}

/**
 * Factory for creating test error scenarios
 * Note: These functions should be used in test files that import MarkdownParseError directly
 */
export class ErrorScenarioFactory {
  static createInvalidSyntaxError() {
    // This should be used in test files that import MarkdownParseError
    // return MarkdownParseError.invalidSyntax('Bad markdown', { line: 5, column: 10 });
    return {
      code: 'INVALID_SYNTAX',
      message: 'Invalid Markdown syntax: Bad markdown',
      location: { line: 5, column: 10 },
    };
  }

  static createMalformedHeaderError() {
    // return MarkdownParseError.malformedHeader('Missing text');
    return {
      code: 'MALFORMED_HEADER',
      message: 'Malformed header: Missing text',
    };
  }

  static createUnclosedCodeBlockError() {
    // return MarkdownParseError.unclosedCodeBlock({ line: 20, column: 1 });
    return {
      code: 'UNCLOSED_CODE_BLOCK',
      message: 'Unclosed code block detected',
      location: { line: 20, column: 1 },
    };
  }

  static createLowConfidenceError() {
    // return MarkdownParseError.lowConfidence(0.6, 0.8);
    return {
      code: 'LOW_CONFIDENCE',
      message: 'Low confidence in structure detection: 0.6 (threshold: 0.8)',
      confidence: 0.6,
    };
  }

  static createInvalidInputError() {
    // return MarkdownParseError.invalidInput('number', 'string');
    return {
      code: 'INVALID_INPUT',
      message: 'Invalid input type: number (expected: string)',
    };
  }

  static createFileTooLargeError() {
    // return MarkdownParseError.fileTooLarge(1000000, 500000);
    return {
      code: 'FILE_TOO_LARGE',
      message: 'File too large: 1000000 bytes (max: 500000 bytes)',
    };
  }
}

/**
 * Test result expectations factory
 */
export class ExpectationFactory {
  static createBasicStructureExpectations() {
    return {
      hasMetadata: true,
      hasChapters: true,
      hasTitle: true,
      confidenceGreaterThan: 0.8,
      totalChaptersAtLeast: 1,
    };
  }

  static createComplexDocumentExpectations() {
    return {
      hasMetadata: true,
      hasChapters: true,
      hasTitle: true,
      confidenceGreaterThan: 0.8,
      totalChaptersAtLeast: 5,
      totalParagraphsAtLeast: 15,
      totalSentencesAtLeast: 20,
      wordCountGreaterThan: 390,
      chapterTitlesInclude: [
        'Overview',
        'Getting Started',
        'Code Examples',
        'Configuration Options',
        'Advanced Features',
        'Troubleshooting',
        'Best Practices',
        'Conclusion',
      ],
      paragraphTypesInclude: ['text', 'code', 'blockquote', 'list', 'table'],
    };
  }

  static createValidationExpectations() {
    return {
      isValid: true,
      errorsEmpty: true,
      scoreGreaterThan: 0.7,
      warningsLessThan: 5,
    };
  }

  static createPerformanceExpectations() {
    return {
      parseTimeLessThanMs: 5000,
      durationGreaterThan: 10,
      durationLessThan: 600,
      hasProcessingMetrics: true,
      parseDurationGreaterThan: 0,
    };
  }
}

/**
 * Test ID generator for requirements traceability
 */
export class TestIdGenerator {
  static generate(
    testType: 'UNIT' | 'INTEGRATION' | 'E2E',
    storyId: string,
    sequenceNumber: number
  ): string {
    const paddedSequence = sequenceNumber.toString().padStart(3, '0');
    return `${storyId}-${testType}-${paddedSequence}`;
  }

  static generateUnit(storyId: string, sequenceNumber: number): string {
    return this.generate('UNIT', storyId, sequenceNumber);
  }

  static generateIntegration(storyId: string, sequenceNumber: number): string {
    return this.generate('INTEGRATION', storyId, sequenceNumber);
  }

  static generateE2E(storyId: string, sequenceNumber: number): string {
    return this.generate('E2E', storyId, sequenceNumber);
  }
}

/**
 * BDD test structure templates
 */
export class BDDTemplateFactory {
  static givenWhenThen(
    given: string[],
    when: string[],
    then: string[]
  ): string {
    return `
    // Given
${given.map((g) => `    // ${g}`).join('\n')}

    // When
${when.map((w) => `    // ${w}`).join('\n')}

    // Then
${then.map((t) => `    // ${t}`).join('\n')}
    `.trim();
  }

  static createGivenWhenThenComment(
    setupConditions: string[],
    actions: string[],
    expectedOutcomes: string[]
  ): string {
    return this.givenWhenThen(setupConditions, actions, expectedOutcomes);
  }
}
