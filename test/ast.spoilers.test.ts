import { nodeToHtml } from '../src/lib/ast';

describe('ast.spoilers complex cases', () => {
  test('multiple spoilers in one text node', () => {
    const node: any = { type: 'text', value: 'This ||one|| and ||two|| done' };
    const html = nodeToHtml(node);
    expect((html.match(/<tg-spoiler>/g) || []).length).toBe(2);
  });

  test('spoiler next to punctuation', () => {
    const node: any = { type: 'text', value: 'Check this(||wow||).' };
    const html = nodeToHtml(node);
    // Should convert the spoiler even if adjacent to punctuation
    expect(html).toContain('<tg-spoiler>wow</tg-spoiler>');
  });

  test('spoiler after parentheses URL should not convert', () => {
    const node: any = { type: 'text', value: '(http://example.com/||no||)' };
    const html = nodeToHtml(node);
    expect(html).toContain('||no||');
    expect(html).not.toContain('<tg-spoiler>');
  });
});
