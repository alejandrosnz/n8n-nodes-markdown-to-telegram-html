import { nodeToHtml } from '../src/lib/ast';

// Minimal node helpers to keep tests legible
const text = (v: string) => ({ type: 'text', value: v });
const cell = (children: any[]) => ({ type: 'tableCell', children });
const row = (cells: any[]) => ({ type: 'tableRow', children: cells });
const table = (rows: any[]) => ({ type: 'table', children: rows });

describe('ast.nodeToHtml - tables', () => {
  test('wraps reconstructed table in <pre><code> and inserts separator after header', () => {
    const tbl = table([
      // header row
      row([ cell([ text('Header 1') ]), cell([ text('Header 2') ]) ]),
      // data row
      row([ cell([ text('Cell A') ]), cell([ text('Cell B') ]) ])
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
      row([ cell([ text('Head | col') ]) ]),
      row([ cell([ text('a | b') ]) ])
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
      row([ cell([ text('<b>bold</b>') ]) ]),
      row([ cell([ text('<script>alert()</script>') ]) ])
    ]);

    const html = nodeToHtml(tbl);

    // All HTML special characters inside the pre/code should be escaped
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert()&lt;/script&gt;');
  });

  test('does not insert separator if table has only a single row', () => {
    const tbl = table([
      // single row only -> treated as no header + data, so no separator inserted
      row([ cell([ text('Only one row') ]), cell([ text('Col2') ]) ])
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
