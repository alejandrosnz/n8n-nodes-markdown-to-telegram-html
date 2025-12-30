# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.12] - 2025-12-30

### ✨ New Features
- **No empty tag-only chunks on split**: `splitHtmlIntoChunks` now filters out chunks that contain only empty HTML tags (e.g., `<pre></pre>`), preventing Telegram API errors with empty messages.
- **Helper: hasVisibleContent**: Added `hasVisibleContent(html)` utility to detect if a chunk contains visible text, used for filtering split output.

### 🧪 Tests
- Added tests for edge cases: very short character limits, consecutive block tags, and empty tag-only chunk filtering.

---

## [1.0.11] - 2025-12-30

### 🐛 Bug Fixes
- **Fixed unclosed HTML tags in truncate/split operations**: Prevents Telegram API errors by ensuring all HTML tags are properly closed at cut boundaries.

### ✨ New Features
- **Automatic tag closure on truncate**: `safeTruncateHtml` now closes open tags before appending `[...]`.
- **Tag continuity on split**: `splitHtmlIntoChunks` closes tags at the end of a chunk and re-opens them at the start of the next one, preserving attributes.
- **Configurable character limit with 4096 cap**: Users can now customize the character limit per message, but it's capped at Telegram's maximum of 4096 characters to prevent API failures.

### 🧪 Tests
- Added new test suite for HTML tag analysis and boundary safety.
- Verified balanced tag output for all message limit strategies.
- Added validation test ensuring character limit never exceeds 4096.

---

## [1.0.10] - 2025-12-30

### ✨ New Features
- **Table Support**: Markdown tables are now converted to Telegram-compatible HTML using `<pre><code>` blocks, preserving table formatting (#3).
- **Clean Escaped Characters Option**: New node property `Clean Escaped Characters` that replaces literal escape sequences (e.g., `\n`) with actual characters (e.g., newlines). Enabled by default.

### 🔧 Improvements
- **Improved Spoiler Handling**: Better parsing and rendering of Telegram spoiler syntax (`||spoiler||` → `<tg-spoiler>`).

### 📝 Documentation
- Updated README with new features and usage examples.

---

## [1.0.9] - 2025-11-03

### 🔥 Key Features
- **Markdown → Telegram HTML conversion**: Based on [andresberrios/n8n-nodes-telegram-better-markdown](https://github.com/andresberrios/n8n-nodes-telegram-better-markdown).
- **Message limit management system**:
  - `truncate` strategy for cutting long content
  - `split` strategy for dividing into multiple messages
- **Configurable node properties**:
  - Markdown Text: Input field for Markdown content
  - Output Field: Customizable output field name (default: `telegram_html`)
  - Message Limit Strategy: Strategy selector for long content
- **Complete test suite** to ensure functionality.
- **Custom icon** for visual identification in n8n.
- **Improved naming and optimized code structure**.

### 🔧 Improvements
- **Refactored codebase** with best practices.
- **Robust HTML handling** that avoids cutting in the middle of tags.
- **Complete documentation** in README with usage examples.

### 📝 Documentation
- Complete README with feature descriptions.
- Usage examples for both strategies.
- Installation and configuration guide.

### 🎯 Based On
- Fork of [andresberrios/n8n-nodes-telegram-better-markdown](https://github.com/andresberrios/n8n-nodes-telegram-better-markdown).
- Significant extensions for message limit handling.
- Improvements in testing and code maintainability.

### 🐛 Bug Fixes
- None (initial release).

### 🔒 Security
- None (initial release).

### ⚠️ Breaking Changes
- None (initial release).

