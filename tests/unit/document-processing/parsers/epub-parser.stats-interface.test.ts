import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
  type EPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

describe('EPUBParser Stats Tests', () => {
  let parser: EPUBParser;
  let fixture: EPUBParserFixture;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC05: should test getStats immutability', () => {
    const stats1 = parser.getStats();
    const stats2 = parser.getStats();

    stats1.parseTimeMs = 999;
    stats1.chaptersPerSecond = 888;
    stats1.memoryUsageMB = 777;
    stats1.cacheHits = 666;
    stats1.cacheMisses = 555;

    expect(stats2.parseTimeMs).toBe(0);
    expect(stats2.chaptersPerSecond).toBe(0);
    expect(stats2.memoryUsageMB).toBe(0);
    expect(stats2.cacheHits).toBe(0);
    expect(stats2.cacheMisses).toBe(0);
  });

  test('MUTATION-TC08: should test performance tracking', async () => {
    const initialStats = parser.getStats();
    expect(initialStats.parseTimeMs).toBe(0);

    await parser.parse(Buffer.from('test content'));

    const updatedStats = parser.getStats();
    expect(typeof updatedStats.parseTimeMs).toBe('number');
    expect(updatedStats.parseTimeMs).toBeGreaterThanOrEqual(0);
  });

  test('MUTATION-TC09: should test stats structure completeness', () => {
    const stats = parser.getStats();

    expect(stats).toHaveProperty('parseTimeMs');
    expect(stats).toHaveProperty('chaptersPerSecond');
    expect(stats).toHaveProperty('memoryUsageMB');
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('cacheMisses');

    expect(typeof stats.parseTimeMs).toBe('number');
    expect(typeof stats.chaptersPerSecond).toBe('number');
    expect(typeof stats.memoryUsageMB).toBe('number');
    expect(typeof stats.cacheHits).toBe('number');
    expect(typeof stats.cacheMisses).toBe('number');
  });
});
