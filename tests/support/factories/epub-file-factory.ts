import { writeFile } from 'fs/promises';
import { join } from 'path';
import { faker } from '@faker-js/faker';
import { createValidEPUBBuffer } from './epub-buffer-factory';
import { EPUBFactoryOptions } from './epub-factory-types';

/**
 * Factory for creating actual EPUB files on disk
 */
export const createValidEPUBFile = async (
  options: EPUBFactoryOptions = {}
): Promise<string> => {
  const buffer = createValidEPUBBuffer(options);
  const fileName = `test-${faker.string.alphanumeric({ length: 10 })}.epub`;
  const filePath = join(process.cwd(), 'tmp', fileName);

  await writeFile(filePath, buffer);
  return filePath;
};

/**
 * Factory for creating complex EPUB files with nested structure
 */
export const createComplexEPUBFile = async (options: {
  title: string;
  structure: Record<string, Array<{ title: string; content: string }>>;
  tocType: 'ncx' | 'nav';
  version: '2.0' | '3.0' | '3.1';
}): Promise<string> => {
  const { title, structure, tocType, version } = options;

  // Flatten nested structure into chapters
  const chapters: Array<{ title: string; content: string; id?: string }> = [];
  let chapterIndex = 1;

  for (const [partTitle, partChapters] of Object.entries(structure)) {
    chapters.push({
      title: partTitle,
      content: `Content for ${partTitle}`,
      id: `part-${chapterIndex++}`,
    });

    partChapters.forEach((chapter) => {
      chapters.push({
        ...chapter,
        id: `chapter-${chapterIndex++}`,
      });
    });
  }

  return createValidEPUBFile({
    title,
    chapters,
    tocType,
    version,
    metadata: {
      complexity: 'high',
      nestedStructure: 'true',
    },
  });
};
