import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

describe('EPUBParser Stats Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

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

    stats1.parseTime = 999;
    stats1.chaptersPerSecond = 888;
    stats1.memoryUsage = 777;
    stats1.cacheHits = 666;
    stats1.cacheMisses = 555;

    expect(stats2.parseTime).toBe(0);
    expect(stats2.chaptersPerSecond).toBe(0);
    expect(stats2.memoryUsage).toBe(0);
    expect(stats2.cacheHits).toBe(0);
    expect(stats2.cacheMisses).toBe(0);
  });

  test('MUTATION-TC08: should test performance tracking', async () => {
    const initialStats = parser.getStats();
    expect(initialStats.parseTime).toBe(0);

    await parser.parse(Buffer.from('test content'));

    const updatedStats = parser.getStats();
    expect(typeof updatedStats.parseTime).toBe('number');
    expect(updatedStats.parseTime).toBeGreaterThanOrEqual(0);
  });

  test('MUTATION-TC09: should test stats structure completeness', () => {
    const stats = parser.getStats();

    expect(stats).toHaveProperty('parseTime');
    expect(stats).toHaveProperty('chaptersPerSecond');
    expect(stats).toHaveProperty('memoryUsage');
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('cacheMisses');

    expect(typeof stats.parseTime).toBe('number');
    expect(typeof stats.chaptersPerSecond).toBe('number');
    expect(typeof stats.memoryUsage).toBe('number');
    expect(typeof stats.cacheHits).toBe('number');
    expect(typeof stats.cacheMisses).toBe('number');
  });
});
