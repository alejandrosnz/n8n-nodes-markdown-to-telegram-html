# Markdown to Telegram-HTML n8n Node

This repository contains a custom **n8n node** that converts **Markdown** into **Telegram-compatible HTML**.  
It preserves Telegram-specific features (like spoilers using `||spoiler||`) and formats standard Markdown into HTML that Telegram accepts.

![Sample usage in a workflow](img/sample_usage_workflow.png)

Initial version based on [andresberrios/n8n-nodes-telegram-better-markdown](https://github.com/andresberrios/n8n-nodes-telegram-better-markdown).

---

## 📘 Overview

This node is designed to:
- Accept a Markdown string and convert it into Telegram-safe HTML.
- Handle Telegram's 4096-character message limit intelligently.
- Allow customization of output field names and overflow strategies.

---

## ⚙️ Node Properties

| Property                   | Type      | Default         | Description                                                               |
|----------------------------|-----------|-----------------|---------------------------------------------------------------------------|
| **Markdown Text**          | `string`  | —               | The Markdown content to convert.                                          |
| **Output Field**           | `string`  | `telegram_html` | Field name in the output JSON containing the generated HTML.              |
| **Message Limit Strategy** | `options` | `truncate`      | Strategy for handling messages exceeding Telegram's 4096-character limit. |
| **Clean Escaped Characters** | `boolean` | `true` | Replace literal escape sequences (e.g. "\\n") with actual characters (e.g. "\n"). |
| **Table Conversion Mode**  | `options` | `codeBlock`     | How to convert Markdown tables for better mobile readability.             |

---

## 🧩 Message Limit Strategies

Telegram limits messages to **4096 characters**.  
This node provides two ways to handle longer content:

### 1. `truncate` — Truncate Message

**Behavior:**  
The generated HTML is truncated to a safe boundary (avoiding broken tags) and appends ` [...]` to indicate omitted content.

**Use Case:**  
When you only need one message output and can tolerate trimming the end.

---

### 2. `split` — Split Message

**Behavior:**  
The HTML is split into multiple parts (each ≤4096 characters).  
Splitting preserves HTML integrity and returns multiple output items — one per chunk — with the same original data except for the updated `Output Field`.

**Use Case:**  
When you want to send the entire message as multiple consecutive Telegram messages without breaking formatting.

---

### Notes on Behavior

- The node uses helper functions that **tokenize HTML** and prefer to cut at safe points (e.g., closed tags or line breaks).  
- **Open HTML tags are automatically closed** before truncation/split boundaries to ensure valid HTML output.
- In `split` mode, **tags are re-opened** at the start of each subsequent chunk to maintain formatting continuity (e.g., `<b>`, `<code>`, `<a href="...">` with attributes preserved).
- In `truncate` mode, a ` [...]` suffix is appended.  
- In `split` mode, each chunk becomes a separate output item — downstream nodes (like Telegram Send Message) will process each part independently.

## � Table Conversion Modes

Tables in Markdown are converted based on the selected **Table Conversion Mode** to improve readability on mobile devices:

### 1. `codeBlock` — Monospaced Table (Default)

**Behavior:**  
Tables are wrapped in `<pre><code>` blocks, preserving the original table structure.

**Output Example:**
```
| Header 1 | Header 2 |
|----------|----------|
| Cell A   | Cell B   |
```

**Use Case:**  
When table structure is important and monospace formatting is acceptable.

### 2. `compactList` — Compact List

**Behavior:**  
Each table row becomes a single list item, with the first column bolded.

**Output Example:**
• **Cell A** — Cell B
• **Cell C** — Cell D

**Use Case:**  
For simple tables where rows represent items, improving mobile readability.

### 3. `detailedList` — Detailed List

**Behavior:**  
Each table row becomes a nested list, with the first column value as the main item and subsequent columns as sub-items with headers.

**Output Example:**
• Cell A
    • Header 2: Cell B
• Cell C
    • Header 2: Cell D

**Use Case:**  
For detailed tables where each row's data needs clear labeling with context.

### 4. `detailedListNoHeaders` — Detailed List without Headers

**Behavior:**  
Each table row becomes a nested list, with the first column value as the main item and subsequent columns as sub-items without headers.

**Output Example:**
• Cell A
    • Cell B
• Cell C
    • Cell D

**Use Case:**  
For tables where the sub-item values are self-explanatory or when headers would be redundant.

## �🔄 Conversions

This node automatically converts standard Markdown elements into their Telegram-compatible HTML equivalents, including:

| Markdown | Telegram HTML Output |
|-----------|----------------------|
| `**bold**` or `__bold__` | `<b>bold</b>` |
| `*italic*` or `_italic_` | `<i>italic</i>` |
| `~~strikethrough~~` | `<s>strikethrough</s>` |
| `__underline__` | `<u>underline</u>` |
| `` `inline code` `` | `<code>inline code</code>` |
| \```code blocks\``` | `<pre><code>...</code></pre>` |
| `> blockquote` | `<blockquote>...</blockquote>` |
| Lists (`-`, `*`, `1.`) | Rendered with proper indentation |
| `[text](url)` | `<a href="url">text</a>` |
| `![alt](tg://emoji?id=12345)` | `<tg-emoji emoji-id="12345">🙂</tg-emoji>` |
| Tables (`\| col1 \| col2 \|`) | `<pre><code>…</code></pre>` (default), or list formats for mobile readability |
| Spoilers (`\|\|secret\|\|`) | `<tg-spoiler>secret</tg-spoiler>` |
| Horizontal rules (`---`) | `------` |

> ⚙️ All unsupported Markdown features are safely escaped or ignored to ensure Telegram compatibility.

---

## 🧪 Example Outputs

### `truncate` Mode

```json
{
  "telegram_html": "<p>This is a long message... [...]</p>"
}
```

A single output item is returned with truncated HTML.

### `split` Mode

```json
[
  { "telegram_html": "<p>Part 1 of the message...</p>" },
  { "telegram_html": "<p>Part 2 of the message...</p>" }
]
```

Multiple items are returned, each containing a valid HTML chunk.

---

## 🧰 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```


### 3. Run unit test

```bash
npm test -- --coverage --runInBand
```

---

## 🧠 Usage in n8n

1. Add the **Markdown to Telegram-HTML** node to your workflow.
2. Provide your Markdown content in the **Markdown Text** field.
3. Optionally change the **Output Field** name (default: `telegram_html`).
4. Choose a **Message Limit Strategy**:
   - `truncate` for a single, shortened message.
   - `split` for multiple message chunks.

![Sample usage settings](img/sample_usage_settings.png)
