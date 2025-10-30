import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import type { EpubMetadata } from '@smoores/epub';
import {
  extractAuthors,
  filterValidCreators,
  formatAuthorsWithRoles,
  getRoleMap,
  formatSubjects,
} from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-authors.js';
import { createCustomMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-custom.js';
import { extractCustomFields } from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-fields.js';
import { logger } from '../../../../src/utils/logger.js';

describe('EPUB Parser Metadata Extractor - Edge Cases and Error Handling', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockLogger?.mockRestore?.();
  });

  describe('Author Extraction Edge Cases', () => {
    test('should handle creators with extremely long names', () => {
      const longName = 'A'.repeat(1000);
      const creators = [{ name: longName, role: 'aut' }];

      const result = extractAuthors(creators);
      expect(result).toBe(longName);
    });

    test('should handle creators with names containing only whitespace', () => {
      const creators = [
        { name: '   ', role: 'aut' },
        { name: '\t\n', role: 'edt' },
        { name: '  \r\n  ', role: 'trl' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe('   , \t\n,   \r\n  ');
    });

    test('should handle creators with names containing quotes and special characters', () => {
      const creators = [
        { name: 'John "The Author" Doe', role: 'aut' },
        { name: "Jane O'Reilly-Smith", role: 'edt' },
        { name: 'Bob & Wilson\\Partners', role: 'trl' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe(
        'John "The Author" Doe, Jane O\'Reilly-Smith, Bob & Wilson\\Partners'
      );
    });

    test('should handle creators with Unicode and emoji characters', () => {
      const creators = [
        { name: 'José Martínez 📚', role: 'aut' },
        { name: 'Автор Петров 🎧', role: 'edt' },
        { name: '作者 张 📖', role: 'trl' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe('José Martínez 📚, Автор Петров 🎧, 作者 张 📖');
    });

    test('should handle creators with numeric and boolean values as names', () => {
      const creators = [
        { name: 123 as any, role: 'aut' },
        { name: true as any, role: 'edt' },
        { name: null as any, role: 'trl' },
        { name: undefined as any, role: 'ill' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe('');
      expect(mockLogger).toHaveBeenCalledTimes(4);
    });

    test('should handle creators with array and object values as names', () => {
      const creators = [
        { name: ['Not', 'Valid'] as any, role: 'aut' },
        { name: { invalid: 'object' } as any, role: 'edt' },
        { name: new Date() as any, role: 'trl' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe('');
      expect(mockLogger).toHaveBeenCalledTimes(3);
    });

    test('should handle creators with role values that are not strings', () => {
      const creators = [
        { name: 'Valid Author 1', role: 123 as any },
        { name: 'Valid Author 2', role: true as any },
        { name: 'Valid Author 3', role: null as any },
        { name: 'Valid Author 4', role: undefined as any },
        { name: 'Valid Author 5', role: ['array'] as any },
        { name: 'Valid Author 6', role: { object: 'role' } as any },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe(
        'Valid Author 1, Valid Author 2, Valid Author 3, Valid Author 4, Valid Author 5, Valid Author 6'
      );
    });

    test('should handle creators with nested or circular object structures', () => {
      const circularObject: any = { name: 'Valid Author' };
      circularObject.self = circularObject;

      const creators = [
        { name: 'Normal Author', role: 'aut' },
        circularObject as any,
        { name: 'Another Normal Author', role: 'edt' },
      ];

      // Should not crash and should filter out the circular reference
      const result = extractAuthors(creators);
      expect(result).toBe('Normal Author, Another Normal Author');
      expect(mockLogger).toHaveBeenCalled();
    });

    test('should handle creators with HTML tags in names', () => {
      const creators = [
        { name: '<script>alert("xss")</script>Author', role: 'aut' },
        { name: 'Author<br/>with<br/>breaks', role: 'edt' },
        { name: '<strong>Bold</strong> Author', role: 'trl' },
      ];

      const result = extractAuthors(creators);
      expect(result).toBe(
        '<script>alert("xss")</script>Author, Author<br/>with<br/>breaks, <strong>Bold</strong> Author'
      );
    });
  });

  describe('Role Mapping Edge Cases', () => {
    test('should handle unknown role codes gracefully', () => {
      const authors = [
        { name: 'Author 1', role: 'unknown_role_1' },
        { name: 'Author 2', role: '' },
        { name: 'Author 3', role: '12345' },
        { name: 'Author 4', role: 'ROLE_WITH_CAPS' },
        { name: 'Author 5', role: 'role-with-dashes' },
      ];
      const roleMap = getRoleMap();

      const result = formatAuthorsWithRoles(authors, roleMap);
      expect(result).toBe(
        'Author 1 (unknown_role_1), Author 2, Author 3 (12345), Author 4 (ROLE_WITH_CAPS), Author 5 (role-with-dashes)'
      );
    });

    test('should handle role codes with special characters', () => {
      const authors = [
        { name: 'Author 1', role: 'aut@special' },
        { name: 'Author 2', role: 'edt#123' },
        { name: 'Author 3', role: 'trl%test' },
      ];
      const roleMap = getRoleMap();

      const result = formatAuthorsWithRoles(authors, roleMap);
      expect(result).toBe(
        'Author 1 (aut@special), Author 2 (edt#123), Author 3 (trl%test)'
      );
    });

    test('should handle very long role codes', () => {
      const longRole = 'x'.repeat(100);
      const authors = [{ name: 'Author', role: longRole }];
      const roleMap = getRoleMap();

      const result = formatAuthorsWithRoles(authors, roleMap);
      expect(result).toBe(`Author (${longRole})`);
    });

    test('should handle role codes that are numbers', () => {
      const authors = [
        { name: 'Author 1', role: '123' },
        { name: 'Author 2', role: '0' },
        { name: 'Author 3', role: '-1' },
      ];
      const roleMap = getRoleMap();

      const result = formatAuthorsWithRoles(authors, roleMap);
      expect(result).toBe('Author 1 (123), Author 2 (0), Author 3 (-1)');
    });
  });

  describe('Subjects Formatting Edge Cases', () => {
    test('should handle subjects with null/undefined values in mixed arrays', () => {
      const subjects = [
        'Valid Subject 1',
        null as any,
        undefined as any,
        { value: 'Valid Subject 2' },
        null as any,
        { value: null as any },
        { value: undefined as any },
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe('Valid Subject 1, , , Valid Subject 2, , , ');
    });

    test('should handle subjects with numeric and boolean values', () => {
      const subjects = [
        123 as any,
        true as any,
        false as any,
        { value: 456 } as any,
        { value: false } as any,
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe('123, true, false, 456, false');
    });

    test('should handle subjects with object values', () => {
      const subjects = [
        { complex: 'object' } as any,
        { nested: { value: 'deep' } } as any,
        { value: { not: 'string' } } as any,
        [],
        new Date() as any,
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe(
        '[object Object], [object Object], [object Object], , '
      );
    });

    test('should handle subjects with HTML and JavaScript', () => {
      const subjects = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'js-protocol:void(0)',
        { value: '<div>HTML Content</div>' },
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe(
        '<script>alert("xss")</script>, <img src="x" onerror="alert(1)">, js-protocol:void(0), <div>HTML Content</div>'
      );
    });

    test('should handle subjects with very long strings', () => {
      const longSubject = 'x'.repeat(1000);
      const subjects = [longSubject];

      const result = formatSubjects(subjects);
      expect(result).toBe(longSubject);
    });

    test('should handle subjects with Unicode and emoji', () => {
      const subjects = [
        '📚 Books',
        '🎧 Audio',
        '📖 Reading',
        'Тема на русском',
        '中文主题',
        'テーマ',
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe(
        '📚 Books, 🎧 Audio, 📖 Reading, Тема на русском, 中文主题, テーマ'
      );
    });
  });

  describe('Custom Metadata Edge Cases', () => {
    test('should create custom metadata with circular references in input', () => {
      const circularObject: any = {
        type: 'description',
        value: 'Valid description',
        properties: {},
      };
      circularObject.self = circularObject;

      const metadata = [
        { type: 'title', value: 'Test Title', properties: {} },
        circularObject,
        { type: 'rights', value: 'Copyright 2023', properties: {} },
      ] as EpubMetadata;

      // Should not crash and handle gracefully
      const result = createCustomMetadata(metadata);
      expect(result).toEqual({
        description: 'Valid description',
        rights: 'Copyright 2023',
        format: '',
        subject: '',
        type: '',
      });
    });

    test('should handle metadata with function values', () => {
      const metadata = [
        {
          type: 'description',
          value: function () {
            return 'function';
          } as any,
          properties: {},
        },
        {
          type: 'rights',
          value: (() => 'arrow function') as any,
          properties: {},
        },
      ] as EpubMetadata;

      const result = createCustomMetadata(metadata);
      expect(result).toEqual({
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      });
    });

    test('should handle metadata with Date and RegExp objects', () => {
      const date = new Date('2023-01-01');
      const regex = /test/g;

      const metadata = [
        { type: 'description', value: date as any, properties: {} },
        { type: 'rights', value: regex as any, properties: {} },
        { type: 'format', value: Symbol('test') as any, properties: {} },
      ] as EpubMetadata;

      const result = createCustomMetadata(metadata);
      expect(result).toEqual({
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      });
    });

    test('should handle metadata with nested arrays', () => {
      const metadata = [
        {
          type: 'description',
          value: ['nested', 'array'] as any,
          properties: {},
        },
        { type: 'rights', value: [1, 2, 3] as any, properties: {} },
        {
          type: 'format',
          value: [{ nested: 'object' }] as any,
          properties: {},
        },
      ] as EpubMetadata;

      const result = createCustomMetadata(metadata);
      expect(result).toEqual({
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      });
    });

    test('should handle extractCustomFields with malformed input', () => {
      const malformedMetadata = [
        { type: null as any, value: 'test', properties: {} },
        { type: undefined as any, value: 'test', properties: {} },
        { type: 123 as any, value: 'test', properties: {} },
        { type: {} as any, value: 'test', properties: {} },
        { type: [] as any, value: 'test', properties: {} },
      ] as EpubMetadata;

      const result = extractCustomFields(malformedMetadata);
      expect(result).toEqual({
        description: '',
        rights: '',
        format: '',
      });
    });

    test('should handle metadata with BigInt and other modern JS types', () => {
      const bigInt = BigInt(12345678901234567890);

      const metadata = [
        { type: 'description', value: bigInt as any, properties: {} },
        { type: 'rights', value: 'Copyright 2023', properties: {} },
      ] as EpubMetadata;

      const result = createCustomMetadata(metadata);
      expect(result).toEqual({
        description: '',
        rights: 'Copyright 2023',
        format: '',
        subject: '',
        type: '',
      });
    });
  });

  describe('Performance and Large Data Handling', () => {
    test('should handle large number of creators efficiently', () => {
      const creators = [];
      for (let i = 0; i < 1000; i++) {
        creators.push({ name: `Author ${i}`, role: 'aut' });
      }

      const startTime = performance.now();
      const result = extractAuthors(creators);
      const endTime = performance.now();

      expect(result).toContain('Author 0');
      expect(result).toContain('Author 999');
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle large number of subjects efficiently', () => {
      const subjects = [];
      for (let i = 0; i < 1000; i++) {
        subjects.push(`Subject ${i}`);
      }

      const startTime = performance.now();
      const result = formatSubjects(subjects);
      const endTime = performance.now();

      expect(result).toContain('Subject 0');
      expect(result).toContain('Subject 999');
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle very large metadata arrays', () => {
      const metadata = [];
      for (let i = 0; i < 1000; i++) {
        metadata.push({
          type: `field_${i}`,
          value: `value_${i}`,
          properties: {},
        });
      }
      // Add the fields we care about at the end
      metadata.push({
        type: 'description',
        value: 'Test description',
        properties: {},
      });
      metadata.push({
        type: 'rights',
        value: 'Copyright 2023',
        properties: {},
      });
      metadata.push({
        type: 'format',
        value: 'application/epub+zip',
        properties: {},
      });

      const startTime = performance.now();
      const result = createCustomMetadata(metadata as EpubMetadata);
      const endTime = performance.now();

      expect(result).toEqual({
        description: 'Test description',
        rights: 'Copyright 2023',
        format: 'application/epub+zip',
        subject: '',
        type: '',
      });
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('Input Validation and Type Safety', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(extractAuthors(null as any)).toBe('');
      expect(extractAuthors(undefined as any)).toBe('');
      expect(filterValidCreators(null as any)).toEqual([]);
      expect(filterValidCreators(undefined as any)).toEqual([]);
      expect(formatAuthorsWithRoles(null as any, {})).toBe('');
      expect(formatAuthorsWithRoles(undefined as any, {})).toBe('');
      expect(formatSubjects(null as any)).toBe('');
      expect(formatSubjects(undefined as any)).toBe('');
      expect(createCustomMetadata(null as any)).toEqual({
        description: undefined,
        rights: undefined,
        format: undefined,
        subject: '',
        type: '',
      });
      expect(createCustomMetadata(undefined as any)).toEqual({
        description: undefined,
        rights: undefined,
        format: undefined,
        subject: '',
        type: '',
      });
    });

    test('should handle empty string and number inputs', () => {
      // These will throw errors because the functions expect arrays
      expect(() => extractAuthors('' as any)).toThrow();
      expect(() => extractAuthors(123 as any)).toThrow();
      expect(() => filterValidCreators('' as any)).toThrow();
      expect(() => filterValidCreators(123 as any)).toThrow();
    });

    test('should maintain immutability of input data', () => {
      const originalCreators = [
        { name: 'Author 1', role: 'aut' },
        { name: 'Author 2', role: 'edt' },
      ];
      const creatorsCopy = JSON.parse(JSON.stringify(originalCreators));

      extractAuthors(originalCreators);

      // Input should not be modified
      expect(originalCreators).toEqual(creatorsCopy);
    });
  });
});
