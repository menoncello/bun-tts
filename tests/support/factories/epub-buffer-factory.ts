import { Buffer } from 'buffer';
import { faker } from '@faker-js/faker';
import {
  createContainerXML,
  createOPFContent,
  createNCXContent,
  createNAVContent,
  createChapterContent,
} from './epub-content-creators';
import { EPUBFactoryOptions } from './epub-factory-types.js';

type EPUBVersion = '2.0' | '3.0' | '3.1' | undefined;
type TOCType = 'ncx' | 'nav' | 'none';

/**
 * Factory for creating EPUB file buffers for testing
 */
export const createValidEPUBBuffer = (
  options: EPUBFactoryOptions = {}
): Buffer => {
  const defaultOptions = getDefaultEPUBOptions();
  const mergedOptions = { ...defaultOptions, ...options };

  // Handle special cases first
  if (mergedOptions.corruptionLevel === 'full') {
    return Buffer.from('This is not a valid EPUB file', 'utf8');
  }

  if (mergedOptions.encrypted) {
    return Buffer.from('ENCRYPTED_EPUB_CONTENT', 'utf8');
  }

  // Create EPUB content
  const epubContent = buildEPUBContent(mergedOptions);

  // Apply corruption if needed
  if (mergedOptions.corruptionLevel === 'partial') {
    return applyPartialCorruption(epubContent);
  }

  return epubContent;
};

/**
 * Factory for creating corrupted EPUB buffers
 */
export const createCorruptedEPUBBuffer = (): Buffer => {
  return Buffer.from('This is not a valid EPUB file structure', 'utf8');
};

/**
 * Factory for creating large EPUB buffers for performance testing
 */
export const createLargeEPUBBuffer = (
  options: Partial<{
    pageCount: number;
    chapterCount: number;
  }> = {}
): Buffer => {
  const { pageCount = 1000, chapterCount = 50 } = options;

  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    title: `Chapter ${i + 1}`,
    content: Array.from({ length: Math.ceil(pageCount / chapterCount) }, () =>
      faker.lorem.paragraphs(5)
    ).join('\n\n'),
  }));

  return createValidEPUBBuffer({
    title: 'Large Test Book',
    chapters,
    tocType: 'nav',
    version: '3.0',
  });
};

// Helper functions

/**
 * Get default EPUB options
 */
function getDefaultEPUBOptions(): Required<EPUBFactoryOptions> {
  return {
    title: faker.lorem.words(3),
    author: faker.person.fullName(),
    language: 'en',
    publisher: faker.company.name(),
    identifier: faker.string.uuid(),
    date: faker.date.recent().toISOString().split('T')[0] ?? '',
    version: '3.0',
    tocType: 'ncx',
    chapters: [
      { title: 'Chapter 1', content: 'This is the first chapter content.' },
      { title: 'Chapter 2', content: 'This is the second chapter content.' },
      { title: 'Chapter 3', content: 'This is the third chapter content.' },
    ],
    embeddedAssets: [],
    metadata: {},
    contentWithImages: false,
    contentWithScripts: false,
    contentWithFormatting: false,
    contentWithMultipleParagraphs: false,
    customFields: {},
    malformedXML: false,
    encrypted: false,
    encoding: 'UTF-8',
    externalReferences: [],
    libraryShouldFail: false,
    corruptionLevel: 'none',
    pageCount: 0,
    chapterCount: 0,
    structure: {},
    offlineMode: false,
    streamingRequired: false,
  };
}

/**
 * Build complete EPUB content
 */
function buildEPUBContent(options: Required<EPUBFactoryOptions>): Buffer {
  const {
    title,
    author,
    language,
    publisher,
    identifier,
    date,
    version,
    tocType,
    chapters,
    embeddedAssets,
    metadata,
    contentWithImages,
    contentWithScripts,
    contentWithFormatting,
    contentWithMultipleParagraphs,
    customFields,
    malformedXML,
  } = options;

  const opfParams = {
    title,
    author,
    language,
    publisher,
    identifier,
    date,
    version,
    customFields,
    metadata,
  };

  const contentOptions = {
    contentWithImages,
    contentWithScripts,
    contentWithFormatting,
    contentWithMultipleParagraphs,
    malformedXML,
  };

  return buildEPUBFromComponents({
    tocType,
    chapters,
    embeddedAssets,
    opfParams,
    contentOptions,
  });
}

/**
 * Build EPUB from components
 */
interface EPUBComponentParams {
  tocType: TOCType;
  chapters: Array<{ title: string; content: string }>;
  embeddedAssets: Array<{ type: string; href: string; size: number }>;
  opfParams: {
    title: string;
    author: string;
    language: string;
    publisher: string;
    identifier: string;
    date: string;
    version: EPUBVersion;
    customFields: Record<string, string>;
    metadata: Record<string, any>;
  };
  contentOptions: {
    contentWithImages: boolean;
    contentWithScripts: boolean;
    contentWithFormatting: boolean;
    contentWithMultipleParagraphs: boolean;
    malformedXML: boolean;
  };
}

function buildEPUBFromComponents(params: EPUBComponentParams): Buffer {
  const { tocType, chapters, embeddedAssets, opfParams, contentOptions } =
    params;

  const mimetype = 'application/epub+zip';
  const containerXML = createContainerXML();
  const opfContent = createOPFContent(opfParams);
  const tocContent = createTOCContent(tocType, chapters);
  const chapterFiles = createChapterFiles(chapters, contentOptions);
  const assetFiles = createAssetFiles(embeddedAssets);

  const zipStructure = buildZipStructure({
    mimetype,
    containerXML,
    opfContent,
    tocContent,
    tocType,
    chapterFiles,
    assetFiles,
  });

  return serializeEPUB(zipStructure);
}

/**
 * Create table of contents content based on type
 */
function createTOCContent(
  tocType: TOCType,
  chapters: Array<{ title: string; content: string }>
): string {
  if (tocType === 'ncx') {
    return createNCXContent(chapters);
  }

  if (tocType === 'nav') {
    return createNAVContent(chapters);
  }

  return '';
}

/**
 * Create chapter files array
 */
function createChapterFiles(
  chapters: Array<{ title: string; content: string }>,
  contentOptions: {
    contentWithImages: boolean;
    contentWithScripts: boolean;
    contentWithFormatting: boolean;
    contentWithMultipleParagraphs: boolean;
    malformedXML: boolean;
  }
): Array<{ path: string; content: Buffer }> {
  return chapters.map((chapter, index) => ({
    path: `OEBPS/chapter${index + 1}.xhtml`,
    content: Buffer.from(createChapterContent(chapter, contentOptions), 'utf8'),
  }));
}

/**
 * Create asset files array
 */
function createAssetFiles(
  embeddedAssets: Array<{ type: string; href: string; size: number }>
) {
  return embeddedAssets.map((asset) => ({
    path: `OEBPS/${asset.href}`,
    content: Buffer.alloc(
      asset.size,
      faker.string.alphanumeric({ length: Math.min(asset.size, 100) })
    ),
  }));
}

/**
 * Build complete ZIP structure
 */
function buildZipStructure(params: {
  mimetype: string;
  containerXML: string;
  opfContent: string;
  tocContent: string;
  tocType: TOCType;
  chapterFiles: Array<{ path: string; content: Buffer }>;
  assetFiles: Array<{ path: string; content: Buffer }>;
}) {
  const {
    mimetype,
    containerXML,
    opfContent,
    tocContent,
    tocType,
    chapterFiles,
    assetFiles,
  } = params;

  const zipStructure = [
    { path: 'mimetype', content: Buffer.from(mimetype, 'utf8') },
    {
      path: 'META-INF/container.xml',
      content: Buffer.from(containerXML, 'utf8'),
    },
    { path: 'OEBPS/content.opf', content: Buffer.from(opfContent, 'utf8') },
    ...chapterFiles,
    ...assetFiles,
  ];

  if (tocContent) {
    zipStructure.push({
      path: tocType === 'ncx' ? 'OEBPS/toc.ncx' : 'OEBPS/nav.xhtml',
      content: Buffer.from(tocContent, 'utf8'),
    });
  }

  return zipStructure;
}

/**
 * Serialize EPUB structure to buffer
 */
function serializeEPUB(
  zipStructure: Array<{ path: string; content: Buffer }>
): Buffer {
  const epbContent = zipStructure
    .map((file) => `${file.path}:${file.content.toString('utf8')}\n`)
    .join('');

  return Buffer.from(epbContent, 'utf8');
}

/**
 * Apply partial corruption to EPUB content
 */
function applyPartialCorruption(_content: Buffer): Buffer {
  // This is a simple corruption simulation
  return Buffer.from('<invalid>corrupted</invalid>', 'utf8');
}
