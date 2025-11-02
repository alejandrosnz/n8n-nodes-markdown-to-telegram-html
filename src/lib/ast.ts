export interface Node {
	type: string;
	value?: string;
	children?: Node[];
	url?: string;
	alt?: string | null | undefined;
	lang?: string;
	ordered?: boolean;
	start?: number;
}

// --- Helper function for escaping HTML special characters ---
export function escapeHtml(text: string): string {
    if (typeof text !== 'string') return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Helper function to get the raw text content of a node ---
export function getNodeText(node: Node): string {
    let text = '';
    if (node.value) {
        text += node.value;
    }
    if (node.children) {
        for (const child of node.children) {
            text += getNodeText(child);
        }
    }
    return text;
}

// --- Helper function to process spoiler syntax in text ---
export function processSpoilers(text: string): string {
    // Replace ||spoiler|| with <tg-spoiler>spoiler</tg-spoiler>, but avoid
    // replacing when the marker appears inside or immediately after a URL
    return text.replace(/\|\|([^|]+?)\|\|/g, (match: string, content: string, offset: number, full: string) => {
        // Find the token (word) that contains the match by looking for surrounding whitespace
        const tokenStart = full.lastIndexOf(' ', offset) + 1;
        const nextSpace = full.indexOf(' ', offset);
        const token = full.slice(tokenStart, nextSpace === -1 ? undefined : nextSpace);

        // If the token (the URL or word around the marker) looks like a URL, skip replacement
        if (token.includes('http') || token.includes('tg:') || token.includes('://')) {
            return match;
        }

        return `<tg-spoiler>${escapeHtml(content)}</tg-spoiler>`;
    });
}

// --- Main function to convert AST nodes to Telegram HTML ---
export function nodeToHtml(node: Node, context: { listDepth?: number; parent?: Node } = {}): string {
    switch (node.type) {
        case 'root':
            return node.children ? node.children.map((child) => nodeToHtml(child, context)).join('').trim() : '';

        case 'paragraph':
            return node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') + '\n\n' : '\n\n';

        case 'heading': {
            const headingContent = node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : '';
            return `<b>${headingContent}</b>\n\n`;
        }

        case 'text': {
            const escapedText = escapeHtml(node.value || '');
            return processSpoilers(escapedText);
        }

        case 'emphasis':
            return `<i>${node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : ''}</i>`;

        case 'strong':
            return `<b>${node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : ''}</b>`;

        case 'delete':
            return `<s>${node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : ''}</s>`;

        case 'inlineCode':
            return `<code>${escapeHtml(node.value || '')}</code>`;

        case 'code': {
            const lang = node.lang ? ` class="language-${node.lang}"` : '';
            const code = escapeHtml(node.value || '');
            return `<pre><code${lang}>${code}</code></pre>\n`;
        }

        case 'link': {
            const url = escapeHtml(node.url || '');
            const linkText = node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : '';
            return `<a href="${url}">${linkText}</a>`;
        }

        case 'image': {
            if (node.url && node.url.startsWith('tg://emoji')) {
                try {
                    const urlObj = new URL(node.url);
                    const emojiId = urlObj.searchParams.get('id');
                    if (emojiId) {
                        return `<tg-emoji emoji-id="${emojiId}">${escapeHtml(node.alt || '')}</tg-emoji>`;
                    }
                } catch {
                    // Fallback for invalid tg:// URL
                }
            }
            const imageUrl = escapeHtml(node.url || '');
            const alt = escapeHtml(node.alt || 'image');
            return `<b><a href="${imageUrl}">${alt}</a></b>`;
        }

        case 'blockquote': {
            let isExpandable = false;
            const rawText = getNodeText(node);

            const lineCount = (rawText.match(/\n/g) || []).length + 1;
            if (lineCount > 4 || rawText.length > 320) {
                isExpandable = true;
            }

            if (rawText.trim().endsWith('||')) {
                isExpandable = true;
                const removeMarker = (n: Node): boolean => {
                    if (n.type === 'text' && n.value && n.value.endsWith('||')) {
                        n.value = n.value.slice(0, -2);
                        return true;
                    }
                    if (n.children) {
                        for (let i = n.children.length - 1; i >= 0; i--) {
                            if (removeMarker(n.children[i])) return true;
                        }
                    }
                    return false;
                };
                removeMarker(node);
            }

            const content = node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : '';
            const tag = isExpandable ? 'blockquote expandable' : 'blockquote';
            return `<${tag}>${content}</${tag}>\n`;
        }

        case 'list': {
            const currentDepth = context.listDepth || 0;
            const newContext = { ...context, listDepth: currentDepth + 1, parent: node };
            const listItems = node.children ? node.children
                .map((child) => nodeToHtml(child, newContext))
                .join('') : '';
            return currentDepth === 0 ? listItems.trimEnd() + '\n\n' : listItems;
        }

        case 'listItem': {
            const depth = context.listDepth || 1;
            const indentation = '&#160;&#160;&#160;&#160;'.repeat(depth - 1);

            let marker;
            if (context.parent?.ordered && context.parent.children) {
                const itemIndex = context.parent.children.indexOf(node);
                marker = `${(context.parent.start || 1) + itemIndex}. `;
            } else {
                marker = '• ';
            }

            let itemContent = '';
            if(node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (child.type === 'paragraph') {
                        itemContent += child.children ? child.children.map((c) => nodeToHtml(c, context)).join('') : '';
                    } else if (child.type === 'list') {
                        const nestedContext = { listDepth: depth, parent: child };
                        const nestedListContent = nodeToHtml(child, nestedContext);
                        itemContent += '\n' + nestedListContent.trimEnd();
                    } else {
                        itemContent += nodeToHtml(child, context);
                    }
                }
            }

            return `${indentation}${marker}${itemContent}\n`;
        }

        case 'thematicBreak':
            return '------\n\n';

        case 'table':
            return `<i>[Table content is not supported and has been omitted]</i>\n`;

        case 'break':
            return '\n';

        default:
            if (node.children) {
                return node.children.map((child) => nodeToHtml(child, context)).join('');
            }
            return '';
    }
}
