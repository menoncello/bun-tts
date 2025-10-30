export interface EPUBFactoryOptions {
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  identifier?: string;
  date?: string;
  version?: '2.0' | '3.0' | '3.1' | undefined;
  tocType?: 'ncx' | 'nav' | 'none';
  chapters?: Array<{ title: string; content: string; id?: string }>;
  embeddedAssets?: Array<{ type: string; href: string; size: number }>;
  metadata?: Record<string, any>;
  contentWithImages?: boolean;
  contentWithScripts?: boolean;
  contentWithFormatting?: boolean;
  contentWithMultipleParagraphs?: boolean;
  customFields?: Record<string, string>;
  malformedXML?: boolean;
  encrypted?: boolean;
  encoding?: string;
  externalReferences?: string[];
  libraryShouldFail?: boolean;
  offlineMode?: boolean;
  corruptionLevel?: 'none' | 'partial' | 'full';
  streamingRequired?: boolean;
  pageCount?: number;
  chapterCount?: number;
  structure?: Record<string, Array<{ title: string; content: string }>>;
}
