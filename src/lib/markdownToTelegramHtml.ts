import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Node } from './ast';
import { nodeToHtml } from './ast';

export function markdownToTelegramHtml(markdown: string): string {
    if (!markdown || typeof markdown !== 'string') return '';

    const processor = unified().use(remarkParse);
    const tree = processor.parse(markdown) as unknown as Node;

    return nodeToHtml(tree);
}
