import { nodeToHtml } from '../src/lib/ast';

// We'll craft minimal node structures to exercise renderer

describe('ast.nodeToHtml', () => {
  test('renders bold and italic and spoilers', () => {
    const root: any = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [ { type: 'text', value: 'Hello ' }, { type: 'strong', children: [ { type: 'text', value: 'World' } ] } ] },
        { type: 'paragraph', children: [ { type: 'text', value: 'This is ||secret||' } ] }
      ]
    };

    const html = nodeToHtml(root);
    expect(html).toContain('<b>World</b>');
    expect(html).toContain('<tg-spoiler>secret</tg-spoiler>');
  });

  test('renders lists with indentation and ordered markers', () => {
    const list: any = {
      type: 'list',
      ordered: false,
      children: [
        { type: 'listItem', children: [ { type: 'paragraph', children: [ { type: 'text', value: 'Item 1' } ] } ] },
        { type: 'listItem', children: [ { type: 'paragraph', children: [ { type: 'text', value: 'Item 2' } ] } ] }
      ]
    };

    const html = nodeToHtml(list);
    expect(html).toContain('• ');
    expect(html).toContain('Item 1');
  });

  test('handles tg emoji image URLs', () => {
    const img: any = { type: 'image', url: 'tg://emoji?id=12345', alt: 'smile' };
    const html = nodeToHtml(img);
    expect(html).toContain('tg-emoji');
    expect(html).toContain('emoji-id="12345"');
  });
});
