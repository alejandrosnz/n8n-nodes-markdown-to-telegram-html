import { markdownToTelegramHtml } from '../src/lib/markdownToTelegramHtml';

describe('markdownToTelegramHtml', () => {
  test('converts simple markdown to telegram html', () => {
    const md = '# Hi\n\nThis is **bold** and ||spoiler||.';
    const html = markdownToTelegramHtml(md);
    expect(html).toContain('<b>');
    expect(html).toContain('<tg-spoiler>');
  });

  test('converts markdown table to pre-formatted code block', () => {
    const md = `
      | Col 1 | Col 2 |
      |---|---|
      | Val 1 | Val 2 |
      `;
    const html = markdownToTelegramHtml(md);
    // Should be wrapped in pre code
    expect(html).toContain('<pre><code>');
    // Should contain the simplified table structure
    expect(html).toContain('| Col 1 | Col 2 |');
    expect(html).toContain('| Val 1 | Val 2 |');
  });

});
