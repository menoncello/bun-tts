import { describe, test, expect } from 'bun:test';
import { processChapterContent } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import {
  createParseOptions,
  createHTMLOptions,
  createBasicHTMLContent,
  createComplexHTMLContent,
  createScriptStyleContent,
  createNestedHTMLContent,
} from './epub-parser-content-processor-test-utils';

// Additional test content creators
function createMalformedHTMLContent(): string {
  return '<p>Unclosed paragraph<div>Nested div without closing';
}

function createHTMLWithAttributes(): string {
  return '<a href="https://example.com" class="link" target="_blank">Link text</a>';
}

function createHTMLCommentContent(): string {
  return '<!-- This is a comment -->';
}

function createHTMLWithWhitespace(): string {
  return '  <p>Content with spaces</p>  ';
}

function createHTMLWithSelfClosingTags(): string {
  return '<p>Content with <br/> line break</p>';
}

function createHTMLWithEntities(): string {
  return '<p>Content with &amp; &lt; &gt; entities</p>';
}

// Test assertion helpers
function assertHTMLStripped(
  result: string,
  expectedText: string,
  ...htmlTags: string[]
) {
  expect(result).toBe(expectedText);
  for (const tag of htmlTags) {
    expect(result).not.toContain(tag);
  }
}

function assertHTMLPreserved(result: string, originalContent: string) {
  expect(result).toBe(originalContent);
}

function assertDoesNotContain(result: string, ...unwantedTexts: string[]) {
  for (const text of unwantedTexts) {
    expect(result).not.toContain(text);
  }
}

describe('EPUB Parser Content Processor - processChapterContent', () => {
  describe('HTML preservation options', () => {
    test('should preserve HTML when preserveHTML option is true', () => {
      const content = createBasicHTMLContent();
      const options = createHTMLOptions(true);

      const result = processChapterContent(content, options);

      assertHTMLPreserved(result, content);
    });

    test('should strip HTML when preserveHTML option is false', () => {
      const content = createBasicHTMLContent();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      assertHTMLStripped(
        result,
        'This is HTML content',
        '<p>',
        '<strong>',
        '</p>',
        '</strong>'
      );
    });

    test('should strip HTML when preserveHTML option is not specified', () => {
      const content = createComplexHTMLContent();
      const options = createParseOptions();

      const result = processChapterContent(content, options);

      assertHTMLStripped(
        result,
        'Title Paragraph with emphasis',
        '<div>',
        '<h1>',
        '<em>'
      );
    });
  });
});

describe('EPUB Parser Content Processor - processChapterContent (Script/Style)', () => {
  describe('script and style handling', () => {
    test('should handle script and style tags when stripping HTML', () => {
      const content = createScriptStyleContent();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      expect(result).toBe('Content More content');
      assertDoesNotContain(result, 'alert', 'color:red');
    });
  });
});

describe('EPUB Parser Content Processor - processChapterContent (Plain Text)', () => {
  describe('content without HTML', () => {
    test('should handle content without HTML tags', () => {
      const content = 'Plain text content without any HTML';
      const options = createParseOptions();

      const result = processChapterContent(content, options);

      expect(result).toBe(content);
    });

    test('should handle empty content', () => {
      const content = '';
      const options = createParseOptions();

      const result = processChapterContent(content, options);

      expect(result).toBe('');
    });
  });
});

describe('EPUB Parser Content Processor - processChapterContent (Edge Cases)', () => {
  describe('HTML edge cases', () => {
    test('should handle malformed HTML gracefully', () => {
      const content = createMalformedHTMLContent();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      assertHTMLStripped(
        result,
        'Unclosed paragraph Nested div without closing',
        '<p>',
        '<div>'
      );
    });

    test('should handle nested HTML structures', () => {
      const content = createNestedHTMLContent();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      assertHTMLStripped(
        result,
        'This is nested HTML content',
        '<div>',
        '<p>',
        '<strong>',
        '<em>'
      );
    });
  });
});

describe('EPUB Parser Content Processor - processChapterContent (Attributes)', () => {
  describe('HTML attributes', () => {
    test('should handle HTML attributes', () => {
      const content = createHTMLWithAttributes();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      assertHTMLStripped(result, 'Link text', 'href=', 'class=', 'target=');
    });
  });
});

describe('EPUB Parser Content Processor - processChapterContent (Misc)', () => {
  describe('edge cases', () => {
    test('should handle content with only HTML comments', () => {
      const content = createHTMLCommentContent();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      expect(result).toBe('');
    });

    test('should handle content with whitespace around HTML', () => {
      const content = createHTMLWithWhitespace();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      expect(result).toBe('Content with spaces');
    });

    test('should handle self-closing tags', () => {
      const content = createHTMLWithSelfClosingTags();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      expect(result).toBe('Content with line break');
      assertDoesNotContain(result, '<br/>');
    });

    test('should handle HTML entities', () => {
      const content = createHTMLWithEntities();
      const options = createHTMLOptions(false);

      const result = processChapterContent(content, options);

      expect(result).toBe('Content with &amp; &lt; &gt; entities');
    });
  });
});
