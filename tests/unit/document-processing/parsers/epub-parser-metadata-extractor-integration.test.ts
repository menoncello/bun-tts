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
import { createMetadataBuilder } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import { logger } from '../../../../src/utils/logger.js';

describe('EPUB Parser Metadata Extractor - Integration Tests', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockLogger?.mockRestore?.();
  });

  describe('Real-world EPUB Scenarios', () => {
    test('should handle academic paper with multiple authors and roles', () => {
      const metadata: EpubMetadata = [
        {
          type: 'title',
          value: 'Advanced Machine Learning Techniques',
          properties: {},
        },
        { type: 'creator', value: 'Dr. John Smith', properties: {} },
        { type: 'creator', value: 'Dr. Jane Doe', properties: {} },
        { type: 'creator', value: 'Prof. Robert Johnson', properties: {} },
        { type: 'creator', value: 'Dr. Emily Brown', properties: {} },
        { type: 'creator', value: 'Dr. Michael Davis', properties: {} },
        { type: 'language', value: 'en', properties: {} },
        { type: 'publisher', value: 'Academic Press', properties: {} },
        { type: 'date', value: '2023-06-15', properties: {} },
        {
          type: 'identifier',
          value: 'doi:10.1234/ml.2023.001',
          properties: {},
        },
        { type: 'subject', value: 'Machine Learning', properties: {} },
        { type: 'subject', value: 'Artificial Intelligence', properties: {} },
        { type: 'subject', value: 'Computer Science', properties: {} },
        {
          type: 'description',
          value:
            'A comprehensive study of advanced ML techniques and their applications.',
          properties: {},
        },
        {
          type: 'rights',
          value: '© 2023 Academic Press. All rights reserved.',
          properties: {},
        },
        { type: 'type', value: 'Journal Article', properties: {} },
      ];

      const authors = [
        { name: 'Dr. John Smith', role: 'aut' },
        { name: 'Dr. Jane Doe', role: 'aut' },
        { name: 'Prof. Robert Johnson', role: 'edt' },
        { name: 'Dr. Emily Brown', role: 'rev' },
        { name: 'Dr. Michael Davis', role: 'ctb' },
      ];

      const subjects = [
        'Machine Learning',
        'Artificial Intelligence',
        'Computer Science',
      ];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const subjectsResult = formatSubjects(subjects);
      const customMetadata = createCustomMetadata(metadata);
      const customFields = extractCustomFields(metadata);

      expect(authorResult).toBe(
        'Dr. John Smith, Dr. Jane Doe, Prof. Robert Johnson, Dr. Emily Brown, Dr. Michael Davis'
      );
      expect(formattedWithRoles).toBe(
        'Dr. John Smith (author), Dr. Jane Doe (author), Prof. Robert Johnson (editor), Dr. Emily Brown (reviewer), Dr. Michael Davis (contributor)'
      );
      expect(subjectsResult).toBe(
        'Machine Learning, Artificial Intelligence, Computer Science'
      );
      expect(customMetadata).toEqual({
        description:
          'A comprehensive study of advanced ML techniques and their applications.',
        rights: '© 2023 Academic Press. All rights reserved.',
        format: '',
        subject: 'Machine Learning',
        type: 'Journal Article',
      });
      expect(customFields).toEqual({
        description:
          'A comprehensive study of advanced ML techniques and their applications.',
        rights: '© 2023 Academic Press. All rights reserved.',
        format: '',
      });
    });

    test('should handle multi-language book with translators', () => {
      const metadata = createMetadataBuilder()
        .title('El Señor de los Anillos')
        .creator('J.R.R. Tolkien', { role: 'aut' })
        .creator('Luis Domènech', { role: 'trl' })
        .creator('Matilde Horne', { role: 'trl' })
        .language('es')
        .publisher('Minotauro')
        .date('2019-09-01')
        .subject('Fantasía')
        .subject('Novela')
        .subject('Aventuras')
        .description('La historia épica de la lucha por el Anillo Único.')
        .rights('© 2019 Minotauro')
        .type('Novela')
        .build();

      const authors = [
        { name: 'J.R.R. Tolkien', role: 'aut' },
        { name: 'Luis Domènech', role: 'trl' },
        { name: 'Matilde Horne', role: 'trl' },
      ];

      const subjects = ['Fantasía', 'Novela', 'Aventuras'];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const subjectsResult = formatSubjects(subjects);
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe('J.R.R. Tolkien, Luis Domènech, Matilde Horne');
      expect(formattedWithRoles).toBe(
        'J.R.R. Tolkien (author), Luis Domènech (translator), Matilde Horne (translator)'
      );
      expect(subjectsResult).toBe('Fantasía, Novela, Aventuras');
      expect(customMetadata.description).toBe(
        'La historia épica de la lucha por el Anillo Único.'
      );
      expect(customMetadata.rights).toBe('© 2019 Minotauro');
    });

    test("should handle children's book with illustrators", () => {
      const metadata = createMetadataBuilder()
        .title('The Gruffalo')
        .creator('Julia Donaldson', { role: 'aut' })
        .creator('Axel Scheffler', { role: 'ill' })
        .language('en')
        .publisher('Puffin Books')
        .date('1999-03-25')
        .subject("Children's Literature")
        .subject('Picture Books')
        .subject('Animals')
        .description(
          'A clever mouse uses his wits to outsmart predators in the deep, dark wood.'
        )
        .rights('© 1999 Julia Donaldson and Axel Scheffler')
        .type("Children's Book")
        .build();

      const authors = [
        { name: 'Julia Donaldson', role: 'aut' },
        { name: 'Axel Scheffler', role: 'ill' },
      ];

      const subjects = ["Children's Literature", 'Picture Books', 'Animals'];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const subjectsResult = formatSubjects(subjects);
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe('Julia Donaldson, Axel Scheffler');
      expect(formattedWithRoles).toBe(
        'Julia Donaldson (author), Axel Scheffler (illustrator)'
      );
      expect(subjectsResult).toBe(
        "Children's Literature, Picture Books, Animals"
      );
      expect(customMetadata.description).toBe(
        'A clever mouse uses his wits to outsmart predators in the deep, dark wood.'
      );
    });

    test('should handle technical manual with multiple contributors', () => {
      // Test data available for testing but not actively used in current test setup

      const authors = [
        { name: 'Thomas Powell', role: 'aut' },
        { name: 'Fritz Schneider', role: 'aut' },
        { name: 'Technical Review Team', role: 'ctb' },
        { name: 'Jane Smith', role: 'edt' },
        { name: 'Design Team', role: 'dsr' },
      ];

      const subjects = [
        'JavaScript',
        'Web Development',
        'Programming',
        'Computer Science',
      ];

      const metadata = createMetadataBuilder()
        .title('Complete Technical Manual')
        .creator('Thomas Powell', { role: 'aut' })
        .creator('Fritz Schneider', { role: 'aut' })
        .description('A comprehensive guide to JavaScript and web development')
        .format('application/epub+zip')
        .build();

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const subjectsResult = formatSubjects(subjects);
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe(
        'Thomas Powell, Fritz Schneider, Technical Review Team, Jane Smith, Design Team'
      );
      expect(formattedWithRoles).toBe(
        'Thomas Powell (author), Fritz Schneider (author), Technical Review Team (contributor), Jane Smith (editor), Design Team (designer)'
      );
      expect(subjectsResult).toBe(
        'JavaScript, Web Development, Programming, Computer Science'
      );
      expect(customMetadata.format).toBe('application/epub+zip');
    });

    test('should handle poetry collection with complex author structure', () => {
      const metadata = createMetadataBuilder()
        .title('Selected Poems')
        .creator('Emily Dickinson', { role: 'aut' })
        .creator('Thomas H. Johnson', { role: 'edt' })
        .creator('R.W. Franklin', { role: 'edt' })
        .creator('Poetry Foundation', { role: 'pbl' })
        .language('en')
        .publisher('Poetry Foundation')
        .date('2016-04-01')
        .subject('Poetry')
        .subject('American Literature')
        .subject('19th Century')
        .description("A collection of Emily Dickinson's most beloved poems.")
        .rights('© 2016 Poetry Foundation')
        .type('Poetry Collection')
        .build();

      const authors = [
        { name: 'Emily Dickinson', role: 'aut' },
        { name: 'Thomas H. Johnson', role: 'edt' },
        { name: 'R.W. Franklin', role: 'edt' },
        { name: 'Poetry Foundation', role: 'pbl' },
      ];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe(
        'Emily Dickinson, Thomas H. Johnson, R.W. Franklin, Poetry Foundation'
      );
      expect(formattedWithRoles).toBe(
        'Emily Dickinson (author), Thomas H. Johnson (editor), R.W. Franklin (editor), Poetry Foundation (publisher)'
      );
      expect(customMetadata.type).toBe('Poetry Collection');
    });

    test('should handle multimedia book with various contributor roles', () => {
      const metadata = createMetadataBuilder()
        .title('Interactive History: World War II')
        .creator('Dr. James Mitchell', { role: 'aut' })
        .creator('Sarah Chen', { role: 'aut' })
        .creator('John Davis', { role: 'nrt' })
        .creator('Maria Rodriguez', { role: 'pht' })
        .creator('Tech Team', { role: 'prg' })
        .creator('Studio X', { role: 'prn' })
        .creator('Educational Board', { role: 'ctb' })
        .language('en')
        .publisher('Interactive Learning Press')
        .date('2022-11-01')
        .subject('History')
        .subject('World War II')
        .subject('Education')
        .subject('Multimedia')
        .description(
          'An interactive multimedia exploration of World War II with audio narration and historical photographs.'
        )
        .rights('© 2022 Interactive Learning Press')
        .type('Interactive Educational Content')
        .format('application/epub+zip')
        .build();

      const authors = [
        { name: 'Dr. James Mitchell', role: 'aut' },
        { name: 'Sarah Chen', role: 'aut' },
        { name: 'John Davis', role: 'nrt' },
        { name: 'Maria Rodriguez', role: 'pht' },
        { name: 'Tech Team', role: 'prg' },
        { name: 'Studio X', role: 'prn' },
        { name: 'Educational Board', role: 'ctb' },
      ];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe(
        'Dr. James Mitchell, Sarah Chen, John Davis, Maria Rodriguez, Tech Team, Studio X, Educational Board'
      );
      expect(formattedWithRoles).toBe(
        'Dr. James Mitchell (author), Sarah Chen (author), John Davis (narrator), Maria Rodriguez (photographer), Tech Team (prg), Studio X (prn), Educational Board (contributor)'
      );
      expect(customMetadata.description).toContain(
        'interactive multimedia exploration'
      );
    });

    test('should handle anthology with many different contributor types', () => {
      const metadata = createMetadataBuilder()
        .title('The Science Fiction Anthology')
        .creator('Isaac Asimov', { role: 'aut' })
        .creator('Arthur C. Clarke', { role: 'aut' })
        .creator('Philip K. Dick', { role: 'aut' })
        .creator('Ursula K. Le Guin', { role: 'aut' })
        .creator('Dr. Robert Wilson', { role: 'edt' })
        .creator('Jane Foster', { role: 'edt' })
        .creator('Art Department', { role: 'art' })
        .creator('Cover Designer', { role: 'dsr' })
        .creator('Proofreading Team', { role: 'pfr' })
        .creator('Publisher Ltd', { role: 'pbl' })
        .language('en')
        .publisher('Future Publishing')
        .date('2020-08-15')
        .subject('Science Fiction')
        .subject('Short Stories')
        .subject('Anthology')
        .subject('Space Opera')
        .subject('Dystopian Fiction')
        .description(
          'A collection of the greatest science fiction stories from master authors.'
        )
        .rights('© 2020 Future Publishing')
        .type('Anthology')
        .build();

      const authors = [
        { name: 'Isaac Asimov', role: 'aut' },
        { name: 'Arthur C. Clarke', role: 'aut' },
        { name: 'Philip K. Dick', role: 'aut' },
        { name: 'Ursula K. Le Guin', role: 'aut' },
        { name: 'Dr. Robert Wilson', role: 'edt' },
        { name: 'Jane Foster', role: 'edt' },
        { name: 'Art Department', role: 'art' },
        { name: 'Cover Designer', role: 'dsr' },
        { name: 'Proofreading Team', role: 'pfr' },
        { name: 'Publisher Ltd', role: 'pbl' },
      ];

      const subjects = [
        'Science Fiction',
        'Short Stories',
        'Anthology',
        'Space Opera',
        'Dystopian Fiction',
      ];

      const authorResult = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const subjectsResult = formatSubjects(subjects);
      const customMetadata = createCustomMetadata(metadata);

      expect(authorResult).toBe(
        'Isaac Asimov, Arthur C. Clarke, Philip K. Dick, Ursula K. Le Guin, Dr. Robert Wilson, Jane Foster, Art Department, Cover Designer, Proofreading Team, Publisher Ltd'
      );
      expect(formattedWithRoles).toBe(
        'Isaac Asimov (author), Arthur C. Clarke (author), Philip K. Dick (author), Ursula K. Le Guin (author), Dr. Robert Wilson (editor), Jane Foster (editor), Art Department (artist), Cover Designer (designer), Proofreading Team (proofreader), Publisher Ltd (publisher)'
      );
      expect(subjectsResult).toBe(
        'Science Fiction, Short Stories, Anthology, Space Opera, Dystopian Fiction'
      );
      expect(customMetadata.type).toBe('Anthology');
    });
  });

  describe('Malformed and Edge Case Integration', () => {
    test('should handle mixed valid and invalid creator data', () => {
      const authors = [
        { name: 'Valid Author 1', role: 'aut' },
        { name: null, role: 'aut' },
        { name: 'Valid Author 2', role: 'edt' },
        { name: '', role: 'trl' },
        { name: 'Valid Author 3' },
        { name: 123, role: 'ill' } as any,
        { name: undefined, role: 'pht' },
      ];

      const validAuthors = filterValidCreators(authors);
      const allAuthorsResult = extractAuthors(authors);
      const validAuthorsResult = extractAuthors(validAuthors);
      const formattedWithRoles = formatAuthorsWithRoles(
        validAuthors,
        getRoleMap()
      );

      expect(validAuthors).toHaveLength(3);
      expect(validAuthors.map((a) => a.name)).toEqual([
        'Valid Author 1',
        'Valid Author 2',
        'Valid Author 3',
      ]);
      expect(allAuthorsResult).toBe(
        'Valid Author 1, Valid Author 2, Valid Author 3'
      );
      expect(validAuthorsResult).toBe(
        'Valid Author 1, Valid Author 2, Valid Author 3'
      );
      expect(formattedWithRoles).toBe(
        'Valid Author 1 (author), Valid Author 2 (editor), Valid Author 3'
      );
      expect(mockLogger).toHaveBeenCalledTimes(8); // 4 invalid creators logged twice (once in extractAuthors, once in formatAuthorsWithRoles)
    });

    test('should handle metadata with missing fields gracefully', () => {
      const minimalMetadata = [
        { type: 'title', value: 'Simple Book', properties: {} },
        { type: 'creator', value: 'Single Author', properties: {} },
      ] as EpubMetadata;

      const customMetadata = createCustomMetadata(minimalMetadata);
      const customFields = extractCustomFields(minimalMetadata);

      expect(customMetadata).toEqual({
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      });
      expect(customFields).toEqual({
        description: '',
        rights: '',
        format: '',
      });
    });

    test('should handle metadata with duplicate fields', () => {
      const duplicateMetadata = [
        { type: 'description', value: 'First description', properties: {} },
        { type: 'description', value: 'Second description', properties: {} },
        { type: 'description', value: 'Third description', properties: {} },
        { type: 'rights', value: 'First rights', properties: {} },
        { type: 'rights', value: 'Second rights', properties: {} },
        { type: 'creator', value: 'Author 1', properties: {} },
        { type: 'creator', value: 'Author 2', properties: {} },
      ] as EpubMetadata;

      const customMetadata = createCustomMetadata(duplicateMetadata);
      const customFields = extractCustomFields(duplicateMetadata);

      expect(customMetadata.description).toBe('First description');
      expect(customMetadata.rights).toBe('First rights');
      expect(customFields.description).toBe('First description');
      expect(customFields.rights).toBe('First rights');
    });

    test('should handle subjects in mixed object and string formats', () => {
      const subjects = [
        'Science Fiction',
        { value: 'Fantasy' },
        'Mystery',
        { value: 'Thriller' },
        null as any,
        undefined as any,
        { value: '' },
        '',
        { value: 123 } as any,
      ];

      const result = formatSubjects(subjects);
      expect(result).toBe(
        'Science Fiction, Fantasy, Mystery, Thriller, , , , , 123'
      );
    });

    test('should handle authors with complex role structures', () => {
      const authors = [
        { name: 'Main Author', role: 'aut' },
        { name: 'Co-Author', role: 'aut' },
        { name: 'Editor', role: 'edt' },
        { name: 'Translator', role: 'trl' },
        { name: 'Illustrator', role: 'ill' },
        { name: 'Photographer', role: 'pht' },
        { name: 'Narrator', role: 'nrt' },
        { name: 'Contributor', role: 'ctb' },
        { name: 'Publisher', role: 'pbl' },
        { name: 'Unknown Role', role: 'xyz123' },
        { name: 'Empty Role', role: '' },
        { name: 'No Role' },
      ];

      const roleMap = getRoleMap();
      const result = formatAuthorsWithRoles(authors, roleMap);

      expect(result).toBe(
        'Main Author (author), Co-Author (author), Editor (editor), Translator (translator), Illustrator (illustrator), Photographer (photographer), Narrator (narrator), Contributor (contributor), Publisher (publisher), Unknown Role (xyz123), Empty Role, No Role'
      );
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle large metadata sets efficiently', () => {
      // Create a large metadata set
      const metadata = [];
      for (let i = 0; i < 1000; i++) {
        metadata.push({
          type: `field_${i}`,
          value: `value_${i}`,
          properties: {},
        });
      }
      // Add the fields we care about
      metadata.push(
        {
          type: 'description',
          value: 'A comprehensive description',
          properties: {},
        },
        { type: 'rights', value: 'Copyright 2023', properties: {} },
        { type: 'format', value: 'application/epub+zip', properties: {} },
        { type: 'subject', value: 'Main Subject', properties: {} },
        { type: 'type', value: 'Book Type', properties: {} }
      );

      const startTime = performance.now();
      const customMetadata = createCustomMetadata(metadata as EpubMetadata);
      const customFields = extractCustomFields(metadata as EpubMetadata);
      const endTime = performance.now();

      expect(customMetadata).toEqual({
        description: 'A comprehensive description',
        rights: 'Copyright 2023',
        format: 'application/epub+zip',
        subject: 'Main Subject',
        type: 'Book Type',
      });
      expect(customFields).toEqual({
        description: 'A comprehensive description',
        rights: 'Copyright 2023',
        format: 'application/epub+zip',
      });
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    test('should handle many authors efficiently', () => {
      const authors = [];
      for (let i = 0; i < 1000; i++) {
        const roles = ['aut', 'edt', 'trl', 'ill', 'ctb'];
        authors.push({
          name: `Author ${i}`,
          role: roles[i % roles.length],
        });
      }

      const startTime = performance.now();
      const result = extractAuthors(authors);
      const formattedWithRoles = formatAuthorsWithRoles(authors, getRoleMap());
      const endTime = performance.now();

      expect(result).toContain('Author 0');
      expect(result).toContain('Author 999');
      expect(formattedWithRoles).toContain('Author 0 (author)');
      expect(formattedWithRoles).toContain('Author 999 (contributor)');
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Error Recovery Integration', () => {
    test('should handle and recover from various malformed inputs', () => {
      // Test various malformed inputs that shouldn't crash the system
      const malformedInputs = [
        null,
        undefined,
        [],
        [null, undefined],
        ['string', 123, true],
        [{}, [], new Date()],
        [{ name: null }, { name: '' }, { name: undefined }],
      ];

      for (const [, input] of malformedInputs.entries()) {
        expect(() => {
          const result = extractAuthors(input as any);
          expect(typeof result).toBe('string');
        }).not.toThrow();

        expect(() => {
          const result = filterValidCreators(input as any);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();

        expect(() => {
          const result = formatAuthorsWithRoles(input as any, getRoleMap());
          expect(typeof result).toBe('string');
        }).not.toThrow();

        expect(() => {
          const result = formatSubjects(input as any);
          expect(typeof result).toBe('string');
        }).not.toThrow();

        expect(() => {
          const result = createCustomMetadata(input as any);
          expect(typeof result).toBe('object');
        }).not.toThrow();
      }
    });
  });
});
