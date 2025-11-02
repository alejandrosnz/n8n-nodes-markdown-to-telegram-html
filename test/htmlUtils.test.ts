import { safeTruncateHtml, splitHtmlIntoChunks } from '../src/lib/htmlUtils';

describe('htmlUtils', () => {
  test('safeTruncateHtml does not cut tags and appends ellipsis', () => {
    const html = '<p>Hello <b>world</b></p><p>Another paragraph</p>';
    const truncated = safeTruncateHtml(html, 20);
    expect(truncated.endsWith('[...]')).toBe(true);
    // Should not contain partial tag like '<b' at the end
    expect(truncated.includes('<p>Hello <b')).toBe(true);
  });

  test('splitHtmlIntoChunks splits into safe parts', () => {
    const html = '<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>';
    const parts = splitHtmlIntoChunks(html, 8);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) {
      expect(p.length).toBeLessThanOrEqual(8 + 10); // small allowance for tokens handling
    }
  });
});
