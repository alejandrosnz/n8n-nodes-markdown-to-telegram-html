import { splitHtmlIntoChunks, hasVisibleContent } from '../src/lib/htmlUtils';

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

describe('hasVisibleContent', () => {
  test('returns true for text content', () => {
    expect(hasVisibleContent('hello')).toBe(true);
  });

  test('returns true for HTML with text', () => {
    expect(hasVisibleContent('<b>hello</b>')).toBe(true);
  });

  test('returns false for empty tags', () => {
    expect(hasVisibleContent('<pre></pre>')).toBe(false);
  });

  test('returns false for nested empty tags', () => {
    expect(hasVisibleContent('<pre><code></code></pre>')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasVisibleContent('')).toBe(false);
  });

  test('returns false for whitespace only', () => {
    expect(hasVisibleContent('   ')).toBe(false);
  });

  test('returns false for tags with whitespace only', () => {
    expect(hasVisibleContent('<b>   </b>')).toBe(false);
  });

  test('returns true for HTML entities', () => {
    expect(hasVisibleContent('&nbsp;')).toBe(true);
    expect(hasVisibleContent('<span>&amp;</span>')).toBe(true);
  });
});

describe('splitHtmlIntoChunks filters empty chunks', () => {
  test('does not produce empty tag-only chunks with very short maxLength', () => {
    const html = '<pre><code>a</code></pre><pre><code>b</code></pre>';
    const parts = splitHtmlIntoChunks(html, 25);
    for (const part of parts) {
      // Each chunk must have visible content, not just tags
      expect(hasVisibleContent(part)).toBe(true);
    }
  });

  test('filters out chunks that would only contain empty tags', () => {
    // Extreme case: maxLength so small that only tags fit
    const html = '<b>text</b>';
    const parts = splitHtmlIntoChunks(html, 50);
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) {
      expect(hasVisibleContent(part)).toBe(true);
    }
  });

  test('preserves content across multiple block elements with small limit', () => {
    const html = '<pre>A</pre><pre>B</pre><pre>C</pre>';
    const parts = splitHtmlIntoChunks(html, 15);
    // All parts should have visible content
    for (const part of parts) {
      expect(hasVisibleContent(part)).toBe(true);
    }
    // Content should be preserved
    const allText = parts.join('').replace(/<[^>]+>/g, '');
    expect(allText).toContain('A');
    expect(allText).toContain('B');
    expect(allText).toContain('C');
  });
});