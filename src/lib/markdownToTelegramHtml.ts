import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Node } from './ast';
import { nodeToHtml } from './ast';

export interface MarkdownOptions {
    tableConversionMode?: string;
}

export function markdownToTelegramHtml(markdown: string, options?: MarkdownOptions): string {
    if (!markdown || typeof markdown !== 'string') return '';

    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm);

    const tree = processor.parse(markdown) as unknown as Node;

    return nodeToHtml(tree, {}, options);
}
