import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Node } from './ast';
import { nodeToHtml } from './ast';

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preprocessTables(markdown: string, mode: string): string {
    if (mode === 'codeBlock') return markdown;

    // Simple table detection: lines starting with |, separated by --- line
    const lines = markdown.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            // Potential table start
            const tableLines: string[] = [];
            let j = i;
            while (j < lines.length && lines[j].trim().startsWith('|')) {
                tableLines.push(lines[j]);
                j++;
            }
            if (tableLines.length >= 2) {
                // Check for separator line
                const separatorIndex = 1;
                if (separatorIndex < tableLines.length && tableLines[separatorIndex].includes('---')) {
                    // It's a table
                    const headers = tableLines[0].split('|').slice(1, -1).map(h => h.trim());
                    const dataRows = tableLines.slice(2).map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));

                    if (mode === 'horizontalList') {
                        for (const row of dataRows) {
                            const cells = row.map((cell, index) => index === 0 ? `**${escapeHtml(cell)}**` : escapeHtml(cell));
                            result.push(`- ${cells.join(' | ')}`);
                        }
                    } else if (mode === 'verticalList') {
                        for (const row of dataRows) {
                            result.push(`- **${escapeHtml(headers[0])}**: ${escapeHtml(row[0])}`);
                            for (let k = 1; k < headers.length; k++) {
                                result.push(`  - ${escapeHtml(headers[k])}: ${escapeHtml(row[k])}`);
                            }
                        }
                    }
                    i = j;
                    continue;
                }
            }
        }
        result.push(lines[i]);
        i++;
    }

    return result.join('\n');
}

export function markdownToTelegramHtml(markdown: string, tableConversionMode: string = 'codeBlock'): string {
    if (!markdown || typeof markdown !== 'string') return '';

    const preprocessed = preprocessTables(markdown, tableConversionMode);

    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm);

    const tree = processor.parse(preprocessed) as unknown as Node;

    return nodeToHtml(tree);
}
