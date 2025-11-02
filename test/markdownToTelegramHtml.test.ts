import { markdownToTelegramHtml } from '../src/lib/markdownToTelegramHtml';

describe('markdownToTelegramHtml', () => {
  test('converts simple markdown to telegram html', () => {
    const md = '# Hi\n\nThis is **bold** and ||spoiler||.';
    const html = markdownToTelegramHtml(md);
    expect(html).toContain('<b>');
    expect(html).toContain('<tg-spoiler>');
  });

});
