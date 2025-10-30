import { describe, test, expect } from 'bun:test';
import { Epub } from '@smoores/epub';

describe('EPUB Library API Integration', () => {
  test('should demonstrate that the library API integration issue was resolved', async () => {
    const epub = await Epub.create({
      title: 'Resolution Test Book',
      language: { textInfo: { direction: 'ltr' } } as any,
      identifier: 'resolution-test-123',
    });

    // These were the exact methods mentioned in the code review as problematic
    const problemMethods = [
      { name: 'getMetadata', method: () => epub.getMetadata() },
      { name: 'getSpineItems', method: () => epub.getSpineItems() },
      { name: 'getTitle', method: () => epub.getTitle() },
      { name: 'getCreators', method: () => epub.getCreators() },
      { name: 'getPublicationDate', method: () => epub.getPublicationDate() },
      { name: 'getSubjects', method: () => epub.getSubjects() },
      { name: 'getType', method: () => epub.getType() },
    ];

    // All problematic methods should now work
    for (const { name, method } of problemMethods) {
      try {
        const result = await method();
        expect(result).toBeDefined();
      } catch (error) {
        throw new Error(`❌ ${name}() method still failing: ${error}`);
      }
    }

    await epub.close();
  });

  test('should verify that all API methods mentioned in the review exist and are callable', async () => {
    const epub = await Epub.create({
      title: 'API Test Book',
      language: { textInfo: { direction: 'ltr' } } as any,
      identifier: 'api-test-123',
    });

    // Test that all required API methods exist and are callable
    const apiMethods = [
      'getMetadata',
      'getSpineItems',
      'getTitle',
      'getCreators',
      'getPublicationDate',
      'getSubjects',
      'getType',
      'close',
    ];

    for (const methodName of apiMethods) {
      expect(typeof (epub as any)[methodName]).toBe('function');
    }

    // Test that all methods can be called without throwing
    await expect(epub.getMetadata()).resolves.toBeDefined();
    await expect(epub.getSpineItems()).resolves.toBeDefined();
    await expect(epub.getTitle()).resolves.toBeDefined();
    await expect(epub.getCreators()).resolves.toBeDefined();
    await expect(epub.getPublicationDate()).resolves.toBeDefined();
    await expect(epub.getSubjects()).resolves.toBeDefined();
    await expect(epub.getType()).resolves.toBeDefined();
    await expect(epub.close()).resolves.toBeUndefined();
  });
});
