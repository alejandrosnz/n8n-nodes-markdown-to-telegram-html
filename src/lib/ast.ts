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
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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

// --- Helper function to validate if a string is a valid emoji ---
function isValidEmoji(text: string): boolean {
    if (!text) return false;
    // Regex to match a single emoji character
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(text.trim());
}

// --- Helper function to process spoiler syntax in text ---
export function processSpoilers(text: string): string {
    // Replace ||spoiler|| with <tg-spoiler>spoiler</tg-spoiler>
    // Avoid replacing when the marker is inside a URL
    return text.replace(/\|\|([\s\S]*?)\|\|/g, (match: string, content: string, offset: number, full: string) => {
        // Look behind to see if it's part of a URL
        const before = full.slice(Math.max(0, offset - 100), offset);

        // If preceded by a URL scheme, do not replace
        if (/(?:https?|tg|ftp):\/\/[^\s]*$/.test(before)) {
            return match;
        }

        // Return the spoiler HTML tag
        return `<tg-spoiler>${content}</tg-spoiler>`;
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
            const lang = node.lang ? ` class="language-${escapeHtml(node.lang)}"` : '';
            const code = escapeHtml(node.value || '');
            return `<pre><code${lang}>${code}</code></pre>\n`;
        }

        case 'link': {
            const url = escapeHtml(node.url || '');
            const linkText = node.children ? node.children.map((child) => nodeToHtml(child, context)).join('') : '';
            return `<a href="${url}">${linkText}</a>`;
        }

        case 'image': {
            // Handle tg://emoji links
            if (node.url && node.url.startsWith('tg://emoji')) {
                try {
                    const urlObj = new URL(node.url);
                    const emojiId = urlObj.searchParams.get('id');
                    if (emojiId) {
                        // Validar que el alt es un emoji válido, sino usar fallback
                        let fallbackEmoji = '❓';
                        if (node.alt && isValidEmoji(node.alt)) {
                            fallbackEmoji = node.alt;
                        }
                        return `<tg-emoji emoji-id="${escapeHtml(emojiId)}">${fallbackEmoji}</tg-emoji>`;
                    }
                } catch {
                    // Fallback for invalid tg:// URL
                }
            }
            // Fallback for regular images: show as bold link with alt text
            const imageUrl = escapeHtml(node.url || '');
            const alt = escapeHtml(node.alt || 'image');
            return `<b><a href="${imageUrl}">${alt}</a></b>`;
        }

        case 'blockquote': {
            let isExpandable = false;
            const rawText = getNodeText(node);

            // Check if blockquote should be expandable
            const lineCount = (rawText.match(/\n/g) || []).length + 1;
            if (lineCount > 4 || rawText.length > 320) {
                isExpandable = true;
            }

            // Handle spoiler blockquote syntax (|| at end)
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
            const openTag = isExpandable ? '<blockquote expandable>' : '<blockquote>';
            const closeTag = '</blockquote>';
            return `${openTag}${content.trim()}${closeTag}\n`;
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

        case 'table': {
            // Build a plain-text markdown-style table and wrap it in a pre/code block
            // We try to reconstruct rows and cells from the AST.
            const rows: string[] = [];

            if (node.children) {
                for (const rowNode of node.children) {
                    // Each rowNode should contain cell nodes as children
                    const cells: string[] = [];
                    if (rowNode.children) {
                        for (const cellNode of rowNode.children) {
                            // getNodeText will pull the raw textual content of the cell
                            let cellText = getNodeText(cellNode) || '';
                            // Escape any pipe chars so the visual table doesn't break
                            cellText = cellText.replace(/\|/g, '\\|');
                            cells.push(cellText.trim());
                        }
                    }
                    if (cells.length > 0) {
                        rows.push(`| ${cells.join(' | ')} |`);
                    }
                }
            }

            // If we have at least a header + one row, ensure there's a separator line after the first row
            if (rows.length >= 2) {
                const headerCols = rows[0].split('|').length - 2; // count columns from header
                const separator = `| ${Array(headerCols).fill('---').join(' | ')} |`;
                rows.splice(1, 0, separator);
            }

            const tableText = rows.join('\n');
            // Escape for HTML since this will be placed inside <pre><code>
            return `<pre><code>${escapeHtml(tableText)}</code></pre>\n`;
        }

        case 'break':
            return '\n';

        default:
            if (node.children) {
                return node.children.map((child) => nodeToHtml(child, context)).join('');
            }
            return '';
    }
}
