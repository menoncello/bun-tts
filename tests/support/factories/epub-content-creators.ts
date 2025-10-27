import { faker } from '@faker-js/faker';

// Helper functions for creating EPUB content
export function createContainerXML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

export function createOPFContent(params: {
  title: string;
  author: string;
  language: string;
  publisher: string;
  identifier: string;
  date: string;
  version: '2.0' | '3.0' | '3.1' | undefined;
  customFields: Record<string, string>;
  metadata: Record<string, any>;
}): string {
  const {
    title,
    author,
    language,
    publisher,
    identifier,
    date,
    version,
    customFields,
    metadata,
  } = params;

  return `<?xml version="1.0" encoding="UTF-8"?>
<package version="${version ?? '3.0'}" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:publisher>${publisher}</dc:publisher>
    <dc:identifier id="BookId">${identifier}</dc:identifier>
    <dc:date>${date}</dc:date>
    ${Object.entries(customFields)
      .map(([key, value]) => `<meta name="${key}" content="${value}"/>`)
      .join('\n    ')}
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter3" href="chapter3.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
    <itemref idref="chapter2"/>
    <itemref idref="chapter3"/>
  </spine>
</package>`;
}

export function createNCXContent(
  chapters: Array<{ title: string; content: string }>
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${faker.string.uuid()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>Table of Contents</text>
  </docTitle>
  <navMap>
    ${chapters
      .map(
        (chapter, index) => `
    <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${chapter.title}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`
      )
      .join('')}
  </navMap>
</ncx>`;
}

export function createNAVContent(
  chapters: Array<{ title: string; content: string }>
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>Table of Contents</title>
  </head>
  <body>
    <nav epub:type="toc">
      <ol>
        ${chapters
          .map(
            (chapter, index) => `
        <li><a href="chapter${index + 1}.xhtml">${chapter.title}</a></li>`
          )
          .join('')}
      </ol>
    </nav>
  </body>
</html>`;
}

export function createChapterContent(
  chapter: { title: string; content: string },
  options: {
    contentWithImages?: boolean;
    contentWithScripts?: boolean;
    contentWithFormatting?: boolean;
    contentWithMultipleParagraphs?: boolean;
    malformedXML?: boolean;
  }
): string {
  const {
    contentWithImages = false,
    contentWithScripts = false,
    contentWithFormatting = false,
    contentWithMultipleParagraphs = false,
    malformedXML = false,
  } = options;

  if (malformedXML) {
    return `<invalid>This is malformed XML content</invalid>`;
  }

  let content = chapter.content;

  if (contentWithMultipleParagraphs) {
    content = Array.from({ length: 3 }, () => faker.lorem.paragraph()).join(
      '\n\n'
    );
  }

  if (contentWithFormatting) {
    content = `<p><strong>This is bold text</strong> and <em>this is italic text</em>.</p><p>${content}</p>`;
  }

  if (contentWithImages) {
    content += `<img src="images/cover.jpg" alt="Cover Image" />`;
  }

  if (contentWithScripts) {
    content += `<script>console.log('This should be filtered out');</script>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${chapter.title}</title>
  </head>
  <body>
    <h1>${chapter.title}</h1>
    ${contentWithFormatting ? content : `<p>${content}</p>`}
  </body>
</html>`;
}
