import { nodeToHtml, escapeHtml } from '../src/lib/ast';

describe('ast.escapeHtml', () => {
  test('escapes double quotes', () => {
    const text = 'Hello "world"';
    const escaped = escapeHtml(text);
    expect(escaped).toBe('Hello &quot;world&quot;');
  });

  test('escapes all special characters', () => {
    const text = '<tag attr="value"> & more';
    const escaped = escapeHtml(text);
    expect(escaped).toBe('&lt;tag attr=&quot;value&quot;&gt; &amp; more');
  });

  test('handles empty string', () => {
    const escaped = escapeHtml('');
    expect(escaped).toBe('');
  });

  test('handles non-string input gracefully', () => {
    const escaped = escapeHtml(null as unknown);
    expect(escaped).toBe('');
  });
});

describe('ast.blockquote.trimming', () => {
  test('blockquote trims internal whitespace', () => {
    const node = {
      type: 'blockquote',
      children: [
        { type: 'text', value: '  Content with spaces  ' }
      ]
    };
    const html = nodeToHtml(node);
    expect(html).toContain('<blockquote>Content with spaces</blockquote>');
  });

  test('expandable blockquote trims content', () => {
    const longText = 'a'.repeat(400);
    const node = {
      type: 'blockquote',
      children: [
        { type: 'text', value: `  ${longText}  ` }
      ]
    };
    const html = nodeToHtml(node);
    expect(html).toContain('<blockquote expandable>');
    expect(html).toContain('</blockquote>');
    expect(html).not.toContain('  a');
  });
});

describe('ast.code.langEscape', () => {
  test('code block escapes language attribute', () => {
    const node = {
      type: 'code',
      lang: 'python"><script>alert(1)</script>',
      value: 'print("hello")'
    };
    const html = nodeToHtml(node);
    expect(html).toContain('class="language-python&quot;&gt;&lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  test('code block with safe language', () => {
    const node = {
      type: 'code',
      lang: 'javascript',
      value: 'console.log("test")'
    };
    const html = nodeToHtml(node);
    expect(html).toContain('class="language-javascript"');
  });
});

describe('ast.link.escaping', () => {
  test('link escapes double quotes in URL', () => {
    const node = {
      type: 'link',
      url: 'https://example.com?param="value"',
      children: [{ type: 'text', value: 'Link' }]
    };
    const html = nodeToHtml(node);
    expect(html).toContain('href="https://example.com?param=&quot;value&quot;"');
  });

  test('link escapes special characters in URL', () => {
    const node = {
      type: 'link',
      url: 'https://example.com?a=<test>&b="value"',
      children: [{ type: 'text', value: 'Link' }]
    };
    const html = nodeToHtml(node);
    expect(html).toContain('&lt;test&gt;');
    expect(html).toContain('&quot;value&quot;');
  });
});
