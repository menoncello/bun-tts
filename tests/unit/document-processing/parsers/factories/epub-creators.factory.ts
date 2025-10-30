/**
 * EPUB Creators Factory for Test Data
 *
 * Provides factory functions for creating mock EPUB creator data
 * with various configurations and edge cases.
 */

/**
 * Factory for creating mock EPUB creator data
 */
export class EpubCreatorsFactory {
  static createStandardCreators() {
    return [
      { name: 'John Doe', role: 'aut' },
      { name: 'Jane Smith', role: 'aut' },
      { name: 'Editor Name', role: 'edt' },
    ];
  }

  static createEmptyCreators(): any[] {
    return [];
  }

  static createSingleCreator() {
    return [{ name: 'Single Author', role: 'aut' }];
  }

  static createCreatorsWithoutRoles() {
    return [{ name: 'Author One' }, { name: 'Author Two' }];
  }

  static createCreatorsWithSpecialCharacters() {
    return [
      { name: 'José Martínez', role: 'aut' },
      { name: 'François Müller', role: 'trl' },
      { name: 'Österreich Verlag', role: 'pbl' },
    ];
  }
}

/**
 * Factory for creating author-specific test data
 */
export class AuthorFactory {
  static createSingleAuthor() {
    return { name: 'John Doe', role: 'aut' };
  }

  static createMultipleAuthors() {
    return [
      { name: 'John Doe', role: 'aut' },
      { name: 'Jane Smith', role: 'aut' },
    ];
  }

  static createMissingAuthors() {
    return [];
  }

  static createWithRoles() {
    return [
      { name: 'John Doe', role: 'aut' },
      { name: 'Jane Smith', role: 'edt' },
    ];
  }

  static createWithSpecialCharacters() {
    return [
      { name: 'José Martínez González', role: 'aut' },
      { name: 'María García López', role: 'aut' },
    ];
  }

  static createMalformed() {
    return [
      { name: null, role: 'aut' },
      { name: '', role: 'aut' },
      { name: undefined, role: 'aut' },
      { name: 'Valid Author', role: null },
      { name: 'Another Author', role: '' },
    ];
  }

  static createEmpty() {
    return [];
  }
}
