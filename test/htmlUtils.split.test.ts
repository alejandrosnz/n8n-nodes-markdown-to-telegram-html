import { splitHtmlIntoChunks } from '../src/lib/htmlUtils';

describe('htmlUtils.split exact and fallback', () => {
  test('splits when no safe boundary: hard cut', () => {
    // Construct HTML with continuous text tokens (no closing block boundaries)
    const html = '<span>' + 'x'.repeat(100) + '</span>' + '<span>' + 'y'.repeat(100) + '</span>';
    const parts = splitHtmlIntoChunks(html, 50);
    // Because of hard cuts, should produce multiple parts
    expect(parts.length).toBeGreaterThanOrEqual(4);
    // Content should be preserved (count all x's and y's across all parts)
    const allContent = parts.join('').replace(/<[^>]+>/g, '');
    expect((allContent.match(/x/g) || []).length).toBe(100);
    expect((allContent.match(/y/g) || []).length).toBe(100);
  });

  test('splits exactly at boundary when token fits exactly', () => {
    const html = '<p>AAAA</p><p>BBBB</p><p>CCCC</p>';
    // Choose a maxLength that aligns with tokens so some parts match exactly
    const parts = splitHtmlIntoChunks(html, 7);
    expect(parts.length).toBeGreaterThan(1);
  });
});

describe('htmlUtils.split tag closure and reopening', () => {
  test('closes open tags at end of chunk', () => {
    const html = '<b>bold text that is very long and will be split across chunks</b>';
    const parts = splitHtmlIntoChunks(html, 30);
    expect(parts.length).toBeGreaterThan(1);
    // First chunk should have closing </b>
    expect(parts[0]).toContain('</b>');
  });

  test('reopens tags at start of next chunk', () => {
    const html = '<b>bold text that is very long and will be split across chunks</b>';
    const parts = splitHtmlIntoChunks(html, 30);
    expect(parts.length).toBeGreaterThan(1);
    // Second chunk should start with <b> to continue the formatting
    expect(parts[1]).toMatch(/^<b>/);
  });

  test('handles nested tags correctly across chunks', () => {
    const html = '<b><i>nested bold italic text that spans multiple chunks when split</i></b>';
    const parts = splitHtmlIntoChunks(html, 40);
    expect(parts.length).toBeGreaterThan(1);
    // First chunk should close in LIFO order: </i></b>
    expect(parts[0]).toContain('</i>');
    expect(parts[0]).toContain('</b>');
    const iClose = parts[0].lastIndexOf('</i>');
    const bClose = parts[0].lastIndexOf('</b>');
    expect(iClose).toBeLessThan(bClose);
    // Second chunk should reopen in original order: <b><i>
    expect(parts[1]).toMatch(/^<b><i>/);
  });

  test('preserves attributes when reopening tags', () => {
    const html = '<a href="https://example.com">This is a very long link that needs to be split into parts</a>';
    const parts = splitHtmlIntoChunks(html, 50);
    expect(parts.length).toBeGreaterThan(1);
    // Second chunk should have the full anchor tag with href
    expect(parts[1]).toContain('<a href="https://example.com">');
  });

  test('each chunk has balanced tags', () => {
    const html = '<code>function example() { return "a very long string that exceeds the limit"; }</code>';
    const parts = splitHtmlIntoChunks(html, 40);
    for (const part of parts) {
      const openCount = (part.match(/<code>/g) || []).length;
      const closeCount = (part.match(/<\/code>/g) || []).length;
      expect(openCount).toBe(closeCount);
    }
  });
});
