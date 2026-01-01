import { nodeToHtml, Node } from '../src/lib/ast';

// Minimal node helpers to keep tests legible
const text = (v: string) => ({ type: 'text', value: v });
const cell = (children: Node[]) => ({ type: 'tableCell', children });
const row = (cells: Node[]) => ({ type: 'tableRow', children: cells });
const table = (rows: Node[]) => ({ type: 'table', children: rows });

describe('ast.nodeToHtml - tables', () => {
  describe('codeBlock mode (default)', () => {
    test('wraps reconstructed table in <pre><code> and inserts separator after header', () => {
      const tbl = table([
        // header row
        row([cell([text('Header 1')]), cell([text('Header 2')])]),
        // data row
        row([cell([text('Cell A')]), cell([text('Cell B')])])
      ]);

      const html = nodeToHtml(tbl);

      // Should be wrapped as pre/code
      expect(html).toContain('<pre><code>');
      expect(html).toContain('</code></pre>');

      // Header line should be present
      expect(html).toContain('| Header 1 | Header 2 |');

      // Separator inserted after header (one '---' per column)
      expect(html).toContain('| --- | --- |');

      // Data row present
      expect(html).toContain('| Cell A | Cell B |');
    });

    test('escapes pipe characters inside cells (so visual table stays correct)', () => {
      const tbl = table([
        row([cell([text('Head | col')])]),
        row([cell([text('a | b')])])
      ]);

      const html = nodeToHtml(tbl);

      // The pipe inside a cell should be escaped with a backslash: '\|'
      // In a JS string literal that is written as '\\|'
      expect(html).toContain('\\|');
      // And the header/data rows should still be present visually
      expect(html).toContain('| Head \\| col |');
      expect(html).toContain('| a \\| b |');
    });

    test('escapes HTML special characters inside table cells', () => {
      const tbl = table([
        row([cell([text('<b>bold</b>')])]),
        row([cell([text('<script>alert()</script>')])])
      ]);

      const html = nodeToHtml(tbl);

      // All HTML special characters inside the pre/code should be escaped
      expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
      expect(html).toContain('&lt;script&gt;alert()&lt;/script&gt;');
    });

    test('does not insert separator if table has only a single row', () => {
      const tbl = table([
        // single row only -> treated as no header + data, so no separator inserted
        row([cell([text('Only one row')]), cell([text('Col2')])])
      ]);

      const html = nodeToHtml(tbl);

      // Should still be wrapped
      expect(html).toContain('<pre><code>');
      // But no separator line should exist
      expect(html).not.toContain('| --- |');
      // The single row content should appear
      expect(html).toContain('| Only one row | Col2 |');
    });
  });

  describe('compactView mode', () => {
    test('converts table to list with em dash separator', () => {
      const tbl = table([
        row([cell([text('Name')]), cell([text('Age')]), cell([text('City')])]),
        row([cell([text('Alice')]), cell([text('30')]), cell([text('NYC')])]),
        row([cell([text('Bob')]), cell([text('25')]), cell([text('LA')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'compactView' });

      expect(html).toContain('- <b>Name</b> — Age — City');
      expect(html).toContain('- <b>Alice</b> — 30 — NYC');
      expect(html).toContain('- <b>Bob</b> — 25 — LA');
      expect(html).not.toContain('<pre>');
    });

    test('skips empty cells in compactView', () => {
      const tbl = table([
        row([cell([text('Title')]), cell([text('')]), cell([text('Value')])]),
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'compactView' });

      expect(html).toContain('- <b>Title</b> — Value');
      expect(html).not.toContain('—  —');
    });

    test('escapes HTML in compactView', () => {
      const tbl = table([
        row([cell([text('<b>Bold</b>')]), cell([text('& symbol')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'compactView' });

      expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
      expect(html).toContain('&amp; symbol');
    });
  });

  describe('detailView mode', () => {
    test('converts table with headers to nested list', () => {
      const tbl = table([
        row([cell([text('Name')]), cell([text('Age')]), cell([text('City')])]),
        row([cell([text('Alice')]), cell([text('30')]), cell([text('NYC')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });

      expect(html).toContain('- <b>Name: Alice</b>');
      expect(html).toContain('  - Age: 30');
      expect(html).toContain('  - City: NYC');
    });

    test('handles multiple rows in detailView', () => {
      const tbl = table([
        row([cell([text('Product')]), cell([text('Price')])]),
        row([cell([text('Apple')]), cell([text('$1')])]),
        row([cell([text('Banana')]), cell([text('$0.50')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });

      expect(html).toContain('- <b>Product: Apple</b>');
      expect(html).toContain('  - Price: $1');
      expect(html).toContain('- <b>Product: Banana</b>');
      expect(html).toContain('  - Price: $0.50');
    });

    test('skips empty cells in detailView', () => {
      const tbl = table([
        row([cell([text('Name')]), cell([text('Age')]), cell([text('City')])]),
        row([cell([text('Alice')]), cell([text('')]), cell([text('NYC')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });

      expect(html).toContain('- <b>Name: Alice</b>');
      expect(html).toContain('  - City: NYC');
      expect(html).not.toContain('Age:');
    });

    test('handles table without explicit headers', () => {
      const tbl = table([
        row([cell([text('Alice')]), cell([text('30')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });

      // Without headers, should just show values
      expect(html).toContain('- <b>Alice</b>');
      expect(html).toContain('  - 30');
    });

    test('escapes HTML in detailView', () => {
      const tbl = table([
        row([cell([text('Name')]), cell([text('Value')])]),
        row([cell([text('<script>')]), cell([text('&test')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });

      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;test');
    });
  });

  describe('detailViewNoHeaders mode', () => {
    test('converts table to nested list without header names', () => {
      const tbl = table([
        row([cell([text('Alice')]), cell([text('30')]), cell([text('NYC')])]),
        row([cell([text('Bob')]), cell([text('25')]), cell([text('LA')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailViewNoHeaders' });

      expect(html).toContain('- <b>Alice</b>');
      expect(html).toContain('  - 30');
      expect(html).toContain('  - NYC');
      expect(html).toContain('- <b>Bob</b>');
      expect(html).toContain('  - 25');
      expect(html).toContain('  - LA');
    });

    test('skips empty cells in detailViewNoHeaders', () => {
      const tbl = table([
        row([cell([text('Alice')]), cell([text('')]), cell([text('NYC')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailViewNoHeaders' });

      expect(html).toContain('- <b>Alice</b>');
      expect(html).toContain('  - NYC');
      // Should not have an empty list item
      const lines = html.trim().split('\n');
      expect(lines).not.toContain('  - ');
    });

    test('handles single cell rows', () => {
      const tbl = table([
        row([cell([text('OnlyCell')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailViewNoHeaders' });

      expect(html).toContain('- <b>OnlyCell</b>');
      expect(html.trim().split('\n').length).toBe(1);
    });

    test('escapes HTML in detailViewNoHeaders', () => {
      const tbl = table([
        row([cell([text('<tag>')]), cell([text('&entity')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'detailViewNoHeaders' });

      expect(html).toContain('&lt;tag&gt;');
      expect(html).toContain('&amp;entity');
    });
  });

  describe('Unicode and special characters', () => {
    test('handles Unicode characters in all modes', () => {
      const tbl = table([
        row([cell([text('名前')]), cell([text('José')]), cell([text('Москва')])])
      ]);

      const codeBlock = nodeToHtml(tbl, {}, { tableConversionMode: 'codeBlock' });
      const compact = nodeToHtml(tbl, {}, { tableConversionMode: 'compactView' });
      const detail = nodeToHtml(tbl, {}, { tableConversionMode: 'detailView' });
      const detailNoH = nodeToHtml(tbl, {}, { tableConversionMode: 'detailViewNoHeaders' });

      expect(codeBlock).toContain('名前');
      expect(compact).toContain('José');
      expect(detail).toContain('Москва');
      expect(detailNoH).toContain('名前');
    });

    test('handles emoji in tables', () => {
      const tbl = table([
        row([cell([text('😀')]), cell([text('🎉')])])
      ]);

      const html = nodeToHtml(tbl, {}, { tableConversionMode: 'compactView' });
      expect(html).toContain('😀');
      expect(html).toContain('🎉');
    });
  });
});
