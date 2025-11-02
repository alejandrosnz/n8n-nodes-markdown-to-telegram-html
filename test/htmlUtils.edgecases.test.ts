import { safeTruncateHtml, splitHtmlIntoChunks } from '../src/lib/htmlUtils';

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
});
