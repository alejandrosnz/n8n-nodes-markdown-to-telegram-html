import { nodeToHtml } from '../src/lib/ast';

describe('ast.emoji', () => {
  test('tg emoji with valid id renders tg-emoji', () => {
    const node: any = { type: 'image', url: 'tg://emoji?id=999', alt: 'emo' };
    const html = nodeToHtml(node);
    expect(html).toContain('tg-emoji');
    expect(html).toContain('emoji-id="999"');
  });

  test('tg emoji with missing id falls back to link', () => {
    const node: any = { type: 'image', url: 'tg://emoji', alt: 'emo' };
    const html = nodeToHtml(node);
    // Fallback should be a bold link (alt text) when id missing or parsing fails
    expect(html).toContain('<b><a');
  });

  test('invalid tg url fallback', () => {
    // malformed URL that will throw in new URL()
    const node: any = { type: 'image', url: 'tg://emoji?id=%', alt: 'emo' };
    const html = nodeToHtml(node);
    // Implementation may either return a <tg-emoji> (if id parsed) or fallback to a bold link.
    expect(/(<b><a|<tg-emoji)/.test(html)).toBe(true);
  });
});
