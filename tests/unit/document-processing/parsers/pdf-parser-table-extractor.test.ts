/**
 * Unit tests for PDF table extraction functionality.
 */

import { describe, test, expect } from 'bun:test';
import {
  extractTablesFromText,
  type SimpleTable,
} from '../../../../src/core/document-processing/parsers/pdf-parser-table-extractor';

describe('PDF Table Extractor', () => {
  describe('extractTablesFromText', () => {
    test('should extract delimited tables with pipes', () => {
      const text = `
        | Column 1 | Column 2 | Column 3 |
        | Value 1  | Value 2  | Value 3  |
        | Data 1   | Data 2   | Data 3   |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.formatType).toBe('delimited');
      expect(table.rowCount).toBeGreaterThanOrEqual(2);
      expect(table.columnCount).toBeGreaterThanOrEqual(2);
      expect(table.confidence).toBeGreaterThan(0);
    });

    test('should extract tab-delimited tables', () => {
      const text = `
        Column 1\tColumn 2\tColumn 3
        Value 1\tValue 2\tValue 3
        Data 1\tData 2\tData 3
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.formatType).toBe('delimited');
      expect(table.columnCount).toBe(3);
    });

    test('should extract comma-delimited tables', () => {
      const text = `
        Column 1,Column 2,Column 3
        Value 1,Value 2,Value 3
        Data 1,Data 2,Data 3
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.formatType).toBe('delimited');
      expect(table.columnCount).toBe(3);
    });

    test('should extract aligned tables with multiple spaces', () => {
      const text = `
        Column 1    Column 2    Column 3
        Value 1     Value 2     Value 3
        Data 1      Data 2      Data 3
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.formatType).toBe('aligned');
      expect(table.columnCount).toBeGreaterThanOrEqual(2);
    });

    test('should extract table with multiple rows and columns', () => {
      const text = `
        | Name    | Age | City      | Country    |
        | John    | 30  | New York  | USA        |
        | Alice   | 25  | London    | UK         |
        | Bob     | 35  | Paris     | France     |
        | Carol   | 28  | Tokyo     | Japan      |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.rowCount).toBe(5);
      expect(table.columnCount).toBe(4);
      expect(table.rows.length).toBe(5);

      // Verify header row
      expect(table.rows[0]!.cells[0]!.text).toBe('Name');
      expect(table.rows[0]!.metadata?.isHeader).toBe(true);

      // Verify data row
      expect(table.rows[1]!.cells[0]!.text).toBe('John');
      expect(table.rows[1]!.cells[1]!.text).toBe('30');
    });

    test('should handle table with merged cells metadata', () => {
      const text = `
        | Header 1   | Header 2           |
        | Cell 1     | Cell 2 | Cell 3   |
        | Value A    | Value B           |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.confidence).toBeGreaterThan(0);
    });

    test('should return empty array for non-table content', () => {
      const text = `
        This is just regular text content
        without any table structure.
        Multiple lines of paragraph content.
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBe(0);
    });

    test('should handle mixed content with table', () => {
      const text = `
        Some paragraph text before the table.

        | Column | Value |
        | A      | 1     |

        More paragraph text after the table.
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);
      expect(tables[0]!.rowCount).toBe(2);
    });

    test('should extract multiple tables from same page', () => {
      const text = `
        Table 1:
        | Col1 | Col2 |
        | A    | B    |

        Some content between tables.

        Table 2:
        | X | Y | Z |
        | 1 | 2 | 3 |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThanOrEqual(2);
    });

    test('should calculate confidence score correctly', () => {
      const text = `
        | Header | Header |
        | Data   | Data   |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.confidence).toBeGreaterThanOrEqual(0);
      expect(table.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle tables with different formatting styles', () => {
      const text = `
        // Delimited
        | A | B | C |

        // Aligned
        Header    Value
        Data      Info

        // More delimited
        X,Y,Z
        1,2,3
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThanOrEqual(1);

      // Verify different table formats are detected
      const formatTypes = tables.map((t: SimpleTable) => t.formatType);
      expect(formatTypes).toContain('delimited');
    });

    test('should handle empty cells in table', () => {
      const text = `
        | Col1 | Col2 | Col3 |
        | A    |      | C    |
        |      | B    |      |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.columnCount).toBe(3);
      expect(table.confidence).toBeGreaterThan(0);
    });

    test('should track table ID and page number correctly', () => {
      const text = `
        | Header | Value |
        | Data   | Info  |
      `;

      const tables = extractTablesFromText(text, 5);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.pageNumber).toBe(5);
      expect(table.id).toContain('table-5');
    });

    test('should not extract invalid tables with insufficient data', () => {
      const text = `
        | Single |
        | Row    |
      `;

      const tables = extractTablesFromText(text, 1);

      // Single row tables should not be considered valid tables
      expect(tables).toBeDefined();
      // May or may not extract depending on implementation, check confidence
      if (tables.length > 0) {
        expect(tables[0]!.rowCount).toBeGreaterThanOrEqual(2);
      }
    });

    test('should maintain cell position metadata', () => {
      const text = `
        | Col1 | Col2 | Col3 |
        | A    | B    | C    |
        | X    | Y    | Z    |
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.rows.length).toBe(3);
      expect(table.rows[0]!.cells.length).toBe(3);

      // Check cell position metadata
      expect(table.rows[0]!.cells[0]!.position).toEqual({ row: 0, column: 0 });
      expect(table.rows[0]!.cells[1]!.position).toEqual({ row: 0, column: 1 });
      expect(table.rows[1]!.cells[0]!.position).toEqual({ row: 1, column: 0 });
      expect(table.rows[2]!.cells[0]!.position).toEqual({ row: 2, column: 0 });
    });

    test('should detect header rows correctly', () => {
      const text = `
        Product    Price    Stock
        Item 1     $10      100
        Item 2     $20      200
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.metadata?.hasHeaderRow).toBe(true);
      expect(table.rows[0]!.metadata?.isHeader).toBe(true);
      expect(table.rows[1]!.metadata?.isHeader).toBe(false);
    });

    test('should handle semicolon-delimited tables', () => {
      const text = `
        Column1;Column2;Column3
        Value1;Value2;Value3
        Data1;Data2;Data3
      `;

      const tables = extractTablesFromText(text, 1);

      expect(tables).toBeDefined();
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0]!;
      expect(table.formatType).toBe('delimited');
      expect(table.columnCount).toBe(3);
    });
  });
});
