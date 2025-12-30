export function tokenizeHtml(html: string): string[] {
    const tokens: string[] = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        tokens.push(match[0]);
    }
    return tokens;
}

export interface OpenTag {
    tagName: string;
    fullOpenTag: string;
}

/**
 * Analyzes an HTML fragment and returns the list of tags that are open but not closed.
 * Returns them in order of opening (first opened = first in array).
 * Each entry includes the tag name and the full opening tag (with attributes).
 */
export function getOpenTags(html: string): OpenTag[] {
    const openTags: OpenTag[] = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();

        if (fullTag.startsWith('</')) {
            // Closing tag: remove from stack (find last matching open tag)
            for (let i = openTags.length - 1; i >= 0; i--) {
                if (openTags[i].tagName === tagName) {
                    openTags.splice(i, 1);
                    break;
                }
            }
        } else if (!fullTag.endsWith('/>')) {
            // Opening tag (not self-closing)
            openTags.push({ tagName, fullOpenTag: fullTag });
        }
    }
    return openTags;
}

/**
 * Generates closing tags for all open tags in reverse order (LIFO).
 */
export function generateClosingTags(openTags: OpenTag[]): string {
    return openTags
        .slice()
        .reverse()
        .map((t) => `</${t.tagName}>`)
        .join('');
}

/**
 * Generates opening tags from an array of OpenTag in order.
 */
export function generateOpeningTags(openTags: OpenTag[]): string {
    return openTags.map((t) => t.fullOpenTag).join('');
}

export function isSafeBoundary(token: string): boolean {
    if (!token) return false;
    const safeClosing = ["</pre>", "</blockquote>", "</table>", "</ul>", "</ol>", "</div>", "</p>", "</b>", "</i>", "</code>"];
    const lower = token.toLowerCase();
    for (const s of safeClosing) {
        if (lower.endsWith(s)) return true;
    }
    if (/^<hr\b|^<br\b|^<thematicbreak\b/.test(lower)) return true;
    if (/^\s+$/.test(token)) return true;
    return false;
}

export function safeTruncateHtml(html: string, maxLength: number): string {
    if (html.length <= maxLength) return html;
    const tokens = tokenizeHtml(html);
    let acc = '';
    let lastSafeIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (acc.length + t.length > maxLength) break;
        acc += t;
        if (isSafeBoundary(t)) lastSafeIndex = acc.length;
    }
    let result = acc;
    if (lastSafeIndex > 0 && lastSafeIndex < result.length) {
        result = result.slice(0, lastSafeIndex);
    }
    const lastLt = result.lastIndexOf('<');
    const lastGt = result.lastIndexOf('>');
    if (lastLt > lastGt) {
        result = result.slice(0, lastLt);
    }
    result = result.trimEnd();

    // Close any open tags before adding the truncation marker
    const openTags = getOpenTags(result);
    if (openTags.length > 0) {
        result += generateClosingTags(openTags);
    }

    if (!result.endsWith('[...]')) result += ' [...]';
    return result;
}

export function splitHtmlIntoChunks(html: string, maxLength: number): string[] {
    const tokens = tokenizeHtml(html);
    const parts: string[] = [];
    let acc = '';
    let lastSafePos = -1;
    let carryOverTags: OpenTag[] = []; // Tags to re-open at the start of the next chunk

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (acc.length + t.length > maxLength) {
            let chunk: string;
            if (lastSafePos > 0) {
                chunk = acc.slice(0, lastSafePos).trim();
                acc = acc.slice(lastSafePos) + t;
                lastSafePos = -1;
            } else {
                chunk = acc.slice(0, maxLength).trim();
                acc = acc.slice(maxLength) + t;
            }

            // Close any open tags in this chunk
            const openTags = getOpenTags(chunk);
            if (openTags.length > 0) {
                chunk += generateClosingTags(openTags);
                carryOverTags = openTags;
            } else {
                carryOverTags = [];
            }

            parts.push(chunk);

            // Re-open tags at the start of the next chunk content
            if (carryOverTags.length > 0) {
                acc = generateOpeningTags(carryOverTags) + acc;
            }
        } else {
            acc += t;
        }

        if (isSafeBoundary(t)) {
            lastSafePos = acc.length;
        }
    }
    if (acc.trim().length > 0) parts.push(acc.trim());
    return parts;
}
