import { nodeToHtml, processSpoilers } from '../src/lib/ast';

describe('ast.spoilers complex cases', () => {
  test('multiple spoilers in one text node', () => {
    const node = { type: 'text', value: 'This ||one|| and ||two|| done' };
    const html = nodeToHtml(node);
    expect((html.match(/<tg-spoiler>/g) || []).length).toBe(2);
  });

  test('spoiler next to punctuation', () => {
    const node = { type: 'text', value: 'Check this(||wow||).' };
    const html = nodeToHtml(node);
    // Should convert the spoiler even if adjacent to punctuation
    expect(html).toContain('<tg-spoiler>wow</tg-spoiler>');
  });

  test('spoiler after parentheses URL should not convert', () => {
    const node = { type: 'text', value: '(http://example.com/||no||)' };
    const html = nodeToHtml(node);
    expect(html).toContain('||no||');
    expect(html).not.toContain('<tg-spoiler>');
  });
});

describe('ast.processSpoilers', () => {
  test('converts ||spoiler|| to tg-spoiler tag', () => {
    const text = 'This is ||secret|| text';
    const result = processSpoilers(text);
    expect(result).toBe('This is <tg-spoiler>secret</tg-spoiler> text');
  });

  test('does not double-escape already escaped content', () => {
    const text = 'This is ||&lt;b&gt;secret&lt;/b&gt;|| text';
    const result = processSpoilers(text);
    expect(result).toBe('This is <tg-spoiler>&lt;b&gt;secret&lt;/b&gt;</tg-spoiler> text');
  });

  test('ignores spoiler markers inside https URLs', () => {
    const text = 'Check https://example.com||path||/file';
    const result = processSpoilers(text);
    expect(result).toBe('Check https://example.com||path||/file');
  });

  test('ignores spoiler markers inside tg:// URLs', () => {
    const text = 'Check tg://resolve?domain=||something||';
    const result = processSpoilers(text);
    expect(result).toBe('Check tg://resolve?domain=||something||');
  });

  test('ignores spoiler markers inside ftp URLs', () => {
    const text = 'Check ftp://server.com||folder||/file';
    const result = processSpoilers(text);
    expect(result).toBe('Check ftp://server.com||folder||/file');
  });

  test('processes spoiler after URL correctly', () => {
    const text = 'Visit https://example.com and ||secret|| text';
    const result = processSpoilers(text);
    expect(result).toBe('Visit https://example.com and <tg-spoiler>secret</tg-spoiler> text');
  });

  test('handles multiple spoilers', () => {
    const text = '||first|| and ||second|| spoilers';
    const result = processSpoilers(text);
    expect(result).toBe('<tg-spoiler>first</tg-spoiler> and <tg-spoiler>second</tg-spoiler> spoilers');
  });

  test('handles nested pipes correctly', () => {
    const text = '||content with | pipe||';
    const result = processSpoilers(text);
    expect(result).toBe('<tg-spoiler>content with | pipe</tg-spoiler>');
  });
});
