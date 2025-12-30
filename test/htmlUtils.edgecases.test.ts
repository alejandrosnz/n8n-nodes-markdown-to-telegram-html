import { safeTruncateHtml, splitHtmlIntoChunks, getOpenTags, generateClosingTags, generateOpeningTags } from '../src/lib/htmlUtils';

describe('htmlUtils.edgecases', () => {
  test('safeTruncateHtml removes partial trailing tag', () => {
    const html = '<p>hello <b>world</b></p><p>more <i>text</i></p>';
    // Force a cut that would happen in middle of a tag by using small maxLength
    const result = safeTruncateHtml(html, 10);
    // Should not end with a raw '<'
    expect(result.endsWith('<')).toBe(false);
    expect(result).toContain('[...]');
  });

  test('splitHtmlIntoChunks creates parts and respects safe boundaries when possible', () => {
    const html = '<p>AAA</p><p>BBB</p><p>CCC</p><p>DDD</p>';
    const parts = splitHtmlIntoChunks(html, 12);
    expect(parts.length).toBeGreaterThan(1);
    // check that concatenation of parts contains original tokens
    expect(parts.join('')).toContain('AAA');
    expect(parts.join('')).toContain('DDD');
  });

  test('safeTruncateHtml slices to last safe boundary when available', () => {
    // First token is a safe boundary </p>, then a long text that will overflow
    const html = '<p>Intro</p>' + '<div>' + 'x'.repeat(200) + '</div>';
    // Choose maxLength such that acc will include both tokens but need to slice back to the </p>
    const truncated = safeTruncateHtml(html, 20);
    // It should cut back to the safe boundary (so should contain the intro paragraph)
    expect(truncated).toContain('<p>Intro</p>');
    expect(truncated).toContain('[...]');
  });

  test('safeTruncateHtml removes trailing partial tag when lastLt > lastGt', () => {
    // Craft an 'unclosed' tag token: tokenizeHtml will treat '<unclosed' as a tag token
    const html = 'Hello ' + '<unclosed' + 'moretext';
    // Use a small maxLength to force truncation so the accumulator includes the '<unclosed' token
    const truncated = safeTruncateHtml(html, 10);
    // The result must not contain the unclosed tag token
    expect(truncated.includes('<unclosed')).toBe(false);
    expect(truncated).toContain('[...]');
  });

  test('safeTruncateHtml closes open tags before truncation marker', () => {
    const html = '<p>Hello <code>this is a very long code block that will be truncated</code></p>';
    const truncated = safeTruncateHtml(html, 30);
    // Should close the <code> and <p> tags
    expect(truncated).toContain('</code>');
    expect(truncated).toContain('</p>');
    expect(truncated).toContain('[...]');
  });

  test('safeTruncateHtml closes nested tags in correct LIFO order', () => {
    const html = '<b><i><code>deeply nested content that is very long</code></i></b>';
    const truncated = safeTruncateHtml(html, 35);
    // Tags should be closed in reverse order: </code></i></b>
    const codeClose = truncated.indexOf('</code>');
    const iClose = truncated.indexOf('</i>');
    const bClose = truncated.indexOf('</b>');
    expect(codeClose).toBeLessThan(iClose);
    expect(iClose).toBeLessThan(bClose);
    expect(truncated).toContain('[...]');
  });

  test('safeTruncateHtml closes anchor tags with href', () => {
    const html = '<a href="https://example.com">This is a very long link text that will be truncated</a>';
    const truncated = safeTruncateHtml(html, 50);
    expect(truncated).toContain('</a>');
    expect(truncated).toContain('[...]');
  });
});

describe('htmlUtils.getOpenTags', () => {
  test('returns empty array for balanced HTML', () => {
    const html = '<p>Hello <b>world</b></p>';
    const openTags = getOpenTags(html);
    expect(openTags).toEqual([]);
  });

  test('detects single open tag', () => {
    const html = '<code>unclosed code';
    const openTags = getOpenTags(html);
    expect(openTags).toHaveLength(1);
    expect(openTags[0].tagName).toBe('code');
    expect(openTags[0].fullOpenTag).toBe('<code>');
  });

  test('detects nested open tags in order', () => {
    const html = '<b><i><code>nested';
    const openTags = getOpenTags(html);
    expect(openTags).toHaveLength(3);
    expect(openTags[0].tagName).toBe('b');
    expect(openTags[1].tagName).toBe('i');
    expect(openTags[2].tagName).toBe('code');
  });

  test('preserves attributes in fullOpenTag', () => {
    const html = '<a href="https://example.com">link text';
    const openTags = getOpenTags(html);
    expect(openTags).toHaveLength(1);
    expect(openTags[0].tagName).toBe('a');
    expect(openTags[0].fullOpenTag).toBe('<a href="https://example.com">');
  });

  test('ignores self-closing tags', () => {
    const html = '<p>Hello<br/>World';
    const openTags = getOpenTags(html);
    expect(openTags).toHaveLength(1);
    expect(openTags[0].tagName).toBe('p');
  });
});

describe('htmlUtils.generateClosingTags', () => {
  test('generates closing tags in reverse order', () => {
    const openTags = [
      { tagName: 'b', fullOpenTag: '<b>' },
      { tagName: 'i', fullOpenTag: '<i>' },
      { tagName: 'code', fullOpenTag: '<code>' },
    ];
    const closing = generateClosingTags(openTags);
    expect(closing).toBe('</code></i></b>');
  });
});

describe('htmlUtils.generateOpeningTags', () => {
  test('generates opening tags with attributes', () => {
    const openTags = [
      { tagName: 'a', fullOpenTag: '<a href="https://example.com">' },
      { tagName: 'b', fullOpenTag: '<b>' },
    ];
    const opening = generateOpeningTags(openTags);
    expect(opening).toBe('<a href="https://example.com"><b>');
  });
});
