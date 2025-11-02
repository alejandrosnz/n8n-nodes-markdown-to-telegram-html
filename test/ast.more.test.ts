import { escapeHtml, getNodeText, nodeToHtml } from '../src/lib/ast';

describe('ast.additional coverage', () => {
  test('escapeHtml replaces special characters', () => {
    expect(escapeHtml('<&>')).toBe('&lt;&amp;&gt;');
    expect(escapeHtml('nochange')).toBe('nochange');
  });

  test('getNodeText concatenates nested text nodes', () => {
    const node = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [ { type: 'text', value: 'A' }, { type: 'text', value: 'B' } ] },
        { type: 'text', value: 'C' }
      ]
    };
    expect(getNodeText(node)).toBe('ABC');
  });

  test('link rendering escapes url and text', () => {
    const node = { type: 'link', url: 'http://x.com?a=1&b=2', children: [ { type: 'text', value: '<click>' } ] };
    const html = nodeToHtml(node);
    expect(html).toContain('href="http://x.com?a=1&amp;b=2"');
    expect(html).toContain('&lt;click&gt;');
  });

  test('regular image renders bold link with escaped alt', () => {
    const node = { type: 'image', url: 'http://img', alt: '<img>' };
    const html = nodeToHtml(node);
    expect(html).toContain('<b><a');
    expect(html).toContain('&lt;img&gt;');
  });

  test('emphasis and delete nodes render correctly inside paragraph', () => {
    const node = { type: 'paragraph', children: [ { type: 'emphasis', children: [ { type: 'text', value: 'it' } ] }, { type: 'delete', children: [ { type: 'text', value: 'del' } ] } ] };
    const html = nodeToHtml(node);
    expect(html).toContain('<i>it</i>');
    expect(html).toContain('<s>del</s>');
  });

  test('thematicBreak and break nodes produce expected output', () => {
    expect(nodeToHtml({ type: 'thematicBreak' })).toBe('------\n\n');
    expect(nodeToHtml({ type: 'break' })).toBe('\n');
  });

  test('unknown node type falls back to rendering children', () => {
    const node = { type: 'mystery', children: [ { type: 'text', value: 'X' }, { type: 'text', value: 'Y' } ] };
    expect(nodeToHtml(node)).toBe('XY');
  });
});
