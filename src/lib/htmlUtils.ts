export function tokenizeHtml(html: string): string[] {
    const tokens: string[] = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        tokens.push(match[0]);
    }
    return tokens;
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
    if (!result.endsWith('[...]')) result += ' [...]';
    return result;
}

export function splitHtmlIntoChunks(html: string, maxLength: number): string[] {
    const tokens = tokenizeHtml(html);
    const parts: string[] = [];
    let acc = '';
    let lastSafePos = -1;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (acc.length + t.length > maxLength) {
            if (lastSafePos > 0) {
                parts.push(acc.slice(0, lastSafePos).trim());
                acc = acc.slice(lastSafePos) + t;
                lastSafePos = -1;
            } else {
                parts.push(acc.slice(0, maxLength).trim());
                acc = acc.slice(maxLength) + t;
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
