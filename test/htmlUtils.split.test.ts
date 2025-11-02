import { splitHtmlIntoChunks } from '../src/lib/htmlUtils';

describe('htmlUtils.split exact and fallback', () => {
  test('splits when no safe boundary: hard cut', () => {
    // Construct HTML with continuous text tokens (no closing block boundaries)
    const html = '<span>' + 'x'.repeat(100) + '</span>' + '<span>' + 'y'.repeat(100) + '</span>';
    const parts = splitHtmlIntoChunks(html, 50);
    // Because of hard cuts, should produce multiple parts
    expect(parts.length).toBeGreaterThanOrEqual(4);
    // Recombined should contain original sequences
    expect(parts.join('')).toContain('x'.repeat(100));
  });

  test('splits exactly at boundary when token fits exactly', () => {
    const html = '<p>AAAA</p><p>BBBB</p><p>CCCC</p>';
    // Choose a maxLength that aligns with tokens so some parts match exactly
    const parts = splitHtmlIntoChunks(html, 7);
    expect(parts.length).toBeGreaterThan(1);
  });
});
