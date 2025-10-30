import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Epub } from '@smoores/epub';
import {
  extractAuthors,
  filterValidCreators,
  formatAuthorsWithRoles,
  getRoleMap,
  formatSubjects,
} from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-authors.js';
import { logger } from '../../../../src/utils/logger.js';
import {
  MockEpubFactory,
  CreatorTestDataFactory,
  ExpectedResultFactory,
} from './epub-parser-metadata-test-factory';

describe('EPUB Parser Metadata Extractor - extractAuthors', () => {
  let _mockEpub: Epub;
  let mockLogger: any;

  beforeEach(() => {
    _mockEpub = MockEpubFactory.createStandard();
    mockLogger = spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockLogger?.mockRestore?.();
  });

  test('should extract single author', async () => {
    const testData = CreatorTestDataFactory.createSingleAuthor();
    const expected = ExpectedResultFactory.createSingleAuthorString();
    const creators = [testData]; // testData is a single author object, wrap in array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });

  test('should extract multiple authors', async () => {
    const testData = CreatorTestDataFactory.createMultipleAuthors();
    const expected = ExpectedResultFactory.createMultipleAuthorsString();
    const creators = testData; // testData is already the creators array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });

  test('should handle missing authors', async () => {
    const testData = CreatorTestDataFactory.createMissingAuthors();
    const expected = ExpectedResultFactory.createMissingAuthorsString();
    const creators = testData; // testData is already the creators array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });

  test('should handle authors with roles', async () => {
    const testData = CreatorTestDataFactory.createWithRoles();
    const expected = ExpectedResultFactory.createWithRolesString();
    const creators = testData; // testData is already the creators array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });

  test('should handle author names with special characters', async () => {
    const testData = CreatorTestDataFactory.createWithSpecialCharacters();
    const expected = ExpectedResultFactory.createWithSpecialCharactersString();
    const creators = testData; // testData is already the creators array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });

  test('should log warnings for malformed author data', async () => {
    const testData = CreatorTestDataFactory.createMalformed();
    const creators = testData as any; // testData contains malformed data types, cast as any

    extractAuthors(creators);

    expect(mockLogger).toHaveBeenCalled();
  });

  test('should handle empty creator list', async () => {
    const testData = CreatorTestDataFactory.createEmpty();
    const expected = ExpectedResultFactory.createEmptyString();
    const creators = testData; // testData is already the creators array

    const result = extractAuthors(creators);

    expect(result).toEqual(expected);
  });
});

describe('EPUB Parser Metadata Extractor - filterValidCreators', () => {
  test('should filter out invalid creators and keep valid ones', () => {
    const creators = [
      { name: 'Valid Author', role: 'aut' },
      { name: null, role: 'aut' },
      { name: '', role: 'aut' },
      { name: undefined, role: 'aut' },
      { name: 'Another Valid Author', role: 'edt' },
      { name: 123, role: 'aut' } as any,
      { name: 'Third Valid Author' },
    ];

    const result = filterValidCreators(creators);

    expect(result).toHaveLength(3);
    expect(result.map((c) => c.name)).toEqual([
      'Valid Author',
      'Another Valid Author',
      'Third Valid Author',
    ]);
  });

  test('should handle empty creators array', () => {
    const result = filterValidCreators([]);
    expect(result).toEqual([]);
  });

  test('should handle creators with non-string names', () => {
    const creators = [
      { name: 'Valid Author', role: 'aut' },
      { name: 123, role: 'aut' } as any,
      { name: {}, role: 'aut' } as any,
      { name: [], role: 'aut' } as any,
    ];

    const result = filterValidCreators(creators);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Valid Author');
  });
});

describe('EPUB Parser Metadata Extractor - getRoleMap', () => {
  test('should return complete role mapping dictionary', () => {
    const roleMap = getRoleMap();

    // Test common roles
    expect(roleMap.aut).toBe('author');
    expect(roleMap.edt).toBe('editor');
    expect(roleMap.trl).toBe('translator');
    expect(roleMap.ill).toBe('illustrator');

    // Test technical roles
    expect(roleMap.pht).toBe('photographer');
    expect(roleMap.bkd).toBe('book designer');
    expect(roleMap.prt).toBe('printer');

    // Test media roles
    expect(roleMap.nrt).toBe('narrator');
    expect(roleMap.mus).toBe('musician');
    expect(roleMap.sng).toBe('singer');

    // Test content creation roles
    expect(roleMap.cph).toBe('copyright holder');
    expect(roleMap.lyr).toBe('lyricist');
    expect(roleMap.cur).toBe('curator');

    // Test production roles
    expect(roleMap.pro).toBe('producer');
    expect(roleMap.fnd).toBe('funder');
    expect(roleMap.own).toBe('owner');

    // Test content roles
    expect(roleMap.ths).toBe('thesis advisor');
    expect(roleMap.wtc).toBe('writer of commentary');

    // Test miscellaneous roles
    expect(roleMap.dte).toBe('dedicatee');
    expect(roleMap.rev).toBe('reviewer');
  });

  test('should have mappings for all expected role codes', () => {
    const roleMap = getRoleMap();
    const expectedRoles = [
      'aut',
      'edt',
      'trl',
      'ill',
      'pbl',
      'clr',
      'art',
      'adt',
      'ann',
      'arr',
      'aqt',
      'bkd',
      'bdd',
      'bll',
      'egr',
      'elt',
      'etr',
      'enj',
      'dsr',
      'ltg',
      'pht',
      'pop',
      'ppm',
      'prt',
      'str',
      'tcd',
      'tyd',
      'wde',
      'wdc',
      'cng',
      'cnd',
      'flm',
      'itr',
      'lgd',
      'lsd',
      'mus',
      'nrt',
      'prf',
      'ppt',
      'scl',
      'sgn',
      'sng',
      'spk',
      'std',
      'stg',
      'vdg',
      'voc',
      'cmm',
      'clb',
      'ctb',
      'crt',
      'cph',
      'cre',
      'cur',
      'hnr',
      'hst',
      'ilu',
      'inv',
      'lbt',
      'lyr',
      'org',
      'pat',
      'res',
      'rth',
      'rtm',
      'fmo',
      'fnd',
      'grt',
      'lse',
      'lso',
      'mdc',
      'mfp',
      'mfr',
      'mod',
      'mrk',
      'orm',
      'own',
      'pbd',
      'pdr',
      'pfr',
      'prd',
      'prn',
      'pro',
      'prm',
      'rps',
      'djr',
      'drm',
      'ins',
      'ive',
      'ivr',
      'sce',
      'tch',
      'ths',
      'trc',
      'wam',
      'wtc',
      'csp',
      'dte',
      'dto',
      'evp',
      'fld',
      'opn',
      'oth',
      'pra',
      'rcp',
      'red',
      'ren',
      'rev',
      'rpc',
      'srv',
    ];

    for (const role of expectedRoles) {
      expect(roleMap).toHaveProperty(role);
      expect(typeof roleMap[role]).toBe('string');
      expect(roleMap[role]).not.toBe('');
    }
  });
});

describe('EPUB Parser Metadata Extractor - formatAuthorsWithRoles', () => {
  test('should format authors with recognized roles', () => {
    const authors = [
      { name: 'John Doe', role: 'aut' },
      { name: 'Jane Smith', role: 'edt' },
      { name: 'Bob Wilson', role: 'trl' },
    ];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe(
      'John Doe (author), Jane Smith (editor), Bob Wilson (translator)'
    );
  });

  test('should format authors with unrecognized roles', () => {
    const authors = [
      { name: 'John Doe', role: 'aut' },
      { name: 'Jane Smith', role: 'xyz' }, // Unrecognized role
      { name: 'Bob Wilson', role: 'custom_role' },
    ];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe(
      'John Doe (author), Jane Smith (xyz), Bob Wilson (custom_role)'
    );
  });

  test('should format authors without roles', () => {
    const authors = [
      { name: 'John Doe' },
      { name: 'Jane Smith', role: '' },
      { name: 'Bob Wilson', role: null as any },
    ];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe('John Doe, Jane Smith, Bob Wilson');
  });

  test('should handle empty authors array', () => {
    const result = formatAuthorsWithRoles([], getRoleMap());
    expect(result).toBe('');
  });

  test('should handle single author with role', () => {
    const authors = [{ name: 'John Doe', role: 'aut' }];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe('John Doe (author)');
  });

  test('should handle authors with special characters in names', () => {
    const authors = [
      { name: 'José Martínez', role: 'aut' },
      { name: 'François Müller', role: 'edt' },
      { name: 'Österreich Verlag', role: 'pbl' },
    ];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe(
      'José Martínez (author), François Müller (editor), Österreich Verlag (publisher)'
    );
  });

  test('should handle authors with complex roles', () => {
    const authors = [
      { name: 'John Doe', role: 'nrt' },
      { name: 'Jane Smith', role: 'pht' },
      { name: 'Bob Wilson', role: 'lyr' },
    ];
    const roleMap = getRoleMap();

    const result = formatAuthorsWithRoles(authors, roleMap);

    expect(result).toBe(
      'John Doe (narrator), Jane Smith (photographer), Bob Wilson (lyricist)'
    );
  });
});

describe('EPUB Parser Metadata Extractor - formatSubjects', () => {
  test('should format array of string subjects', () => {
    const subjects = ['Fiction', 'Science Fiction', 'Adventure'];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction, Science Fiction, Adventure');
  });

  test('should format array of object subjects', () => {
    const subjects = [
      { value: 'Fiction' },
      { value: 'Science Fiction' },
      { value: 'Adventure' },
    ];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction, Science Fiction, Adventure');
  });

  test('should format mixed array of subjects', () => {
    const subjects = [
      'Fiction',
      { value: 'Science Fiction' },
      'Adventure',
      { value: 'Mystery' },
    ];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction, Science Fiction, Adventure, Mystery');
  });

  test('should handle empty subjects array', () => {
    const result = formatSubjects([]);
    expect(result).toBe('');
  });

  test('should handle null/undefined subjects', () => {
    expect(formatSubjects(null as any)).toBe('');
    expect(formatSubjects(undefined as any)).toBe('');
  });

  test('should handle single subject', () => {
    const subjects = ['Fiction'];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction');
  });

  test('should handle subjects with special characters', () => {
    const subjects = ['Ciencia Ficción', 'Aventura', 'Misterio'];
    const result = formatSubjects(subjects);
    expect(result).toBe('Ciencia Ficción, Aventura, Misterio');
  });

  test('should handle subjects with empty values', () => {
    const subjects = [
      'Fiction',
      '',
      { value: 'Science Fiction' },
      { value: '' },
      null as any,
      undefined as any,
    ];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction, , Science Fiction, , , ');
  });

  test('should handle subjects with numeric values in objects', () => {
    const subjects = [
      { value: 'Fiction' },
      { value: 123 } as any,
      { value: 'Science Fiction' },
    ];
    const result = formatSubjects(subjects);
    expect(result).toBe('Fiction, 123, Science Fiction');
  });
});
