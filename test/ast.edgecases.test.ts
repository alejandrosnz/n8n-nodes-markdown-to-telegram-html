import { nodeToHtml } from '../src/lib/ast';

describe('ast.edgecases', () => {
  test('blockquote becomes expandable when ends with marker || and marker removed', () => {
    const node: any = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [ { type: 'text', value: 'Line 1' } ] },
        { type: 'paragraph', children: [ { type: 'text', value: 'Last line||' } ] }
      ]
    };

    const html = nodeToHtml(node);
    expect(html).toContain('blockquote expandable');
    expect(html).not.toContain('||');
  });

  test('blockquote becomes expandable by length (>320 chars)', () => {
    const longText = 'a'.repeat(330);
    const node: any = { type: 'blockquote', children: [ { type: 'paragraph', children: [ { type: 'text', value: longText } ] } ] };
    const html = nodeToHtml(node);
    expect(html).toContain('blockquote expandable');
  });

  test('inline code escapes HTML and code block includes language class', () => {
    const inline: any = { type: 'inlineCode', value: '<&>' };
    const block: any = { type: 'code', value: '<script>', lang: 'js' };
    expect(nodeToHtml(inline)).toContain('&lt;&amp;&gt;');
    expect(nodeToHtml(block)).toContain('class="language-js"');
  });

  test('table returns omission string', () => {
    const t: any = { type: 'table' };
    expect(nodeToHtml(t)).toContain('[Table content is not supported');
  });

  test('ordered list respects start and nested lists indent', () => {
    const list: any = {
      type: 'list',
      ordered: true,
      start: 3,
      children: [
        { type: 'listItem', children: [ { type: 'paragraph', children: [ { type: 'text', value: 'First' } ] } ] },
        { type: 'listItem', children: [ { type: 'paragraph', children: [ { type: 'text', value: 'Second' } ] },
          { type: 'list', ordered: false, children: [ { type: 'listItem', children: [ { type: 'paragraph', children: [ { type: 'text', value: 'Nested' } ] } ] } ] } ] }
      ]
    };

    const html = nodeToHtml(list);
    expect(html).toContain('3. ');
    expect(html).toContain('&#160;&#160;&#160;&#160;');
    expect(html).toContain('Nested');
  });

  test('spoiler not processed inside URLs', () => {
    const node: any = { type: 'text', value: 'http://example.com/||nope||' };
    const html = nodeToHtml(node);
    expect(html).toContain('||nope||');
    expect(html).not.toContain('<tg-spoiler>');
  });
});
