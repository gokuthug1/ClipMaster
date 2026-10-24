// view.js - ClipMaster Detail & Syntax Viewer (v8.5 - Peak Edition)

const IMAGE_URL_PREFIX = "IMG_URL::";

const titleEl = document.getElementById('item-title');
const contentEl = document.getElementById('item-content');
const metaEl = document.getElementById('item-meta');
const controlsEl = document.getElementById('view-controls');
const copyBtn = document.getElementById('copy-btn');
const deleteBtn = document.getElementById('delete-btn');
const formatBtn = document.getElementById('format-btn');
const badgeLang = document.getElementById('badge-code-lang');

let currentItem = null;
let detectedLanguage = null;
let rawCodeText = '';
let isBeautified = false;

// --- Byte / File Size Helpers ---
function getItemByteSize(text) {
    if (!text) return 0;
    if (text.startsWith(IMAGE_URL_PREFIX)) {
        const content = text.substring(IMAGE_URL_PREFIX.length);
        if (content.startsWith("data:image/svg+xml")) {
            const commaIdx = content.indexOf(',');
            const svgContent = commaIdx !== -1 ? content.substring(commaIdx + 1) : content;
            try {
                return new TextEncoder().encode(decodeURIComponent(svgContent)).length;
            } catch (e) {
                return new TextEncoder().encode(svgContent).length;
            }
        } else if (content.startsWith("data:")) {
            const base64Idx = content.indexOf(';base64,');
            if (base64Idx !== -1) {
                const b64 = content.substring(base64Idx + 8);
                const padding = b64.endsWith('==') ? 2 : (b64.endsWith('=') ? 1 : 0);
                return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
            }
        }
        return new TextEncoder().encode(content).length;
    }
    return new TextEncoder().encode(text).length;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
}

// --- Code Language Detector ---
function detectCodeLanguage(text) {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();

    // 1. JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch (e) {}
    }

    // 2. HTML
    const htmlTagRegex = /<\/?([a-zA-Z0-9\-]+)(\s+[^>]*)?\/?>/g;
    const htmlMatches = trimmed.match(htmlTagRegex);
    if (htmlMatches && htmlMatches.length >= 1) {
        const knownHtmlTags = /<\/?(html|head|body|div|span|p|a|ul|ol|li|table|thead|tbody|tr|td|th|script|style|h[1-6]|form|input|button|svg|path|main|section|header|footer|nav|article|aside|template|pre|code)[\s>]/i;
        if (knownHtmlTags.test(trimmed) || /<!DOCTYPE\s+html/i.test(trimmed)) {
            return 'html';
        }
    }

    // 3. CSS
    const cssRuleRegex = /([.#@a-zA-Z0-9_\-*\[\]:"'=,\s>+~]+)\s*\{([^}]*)\}/;
    const cssPropsRegex = /\b(margin|padding|color|background|display|flex|grid|font-size|border|width|height|position|top|left|opacity|transform|box-shadow)\s*:/i;
    if (cssRuleRegex.test(trimmed) && cssPropsRegex.test(trimmed)) {
        return 'css';
    }

    // 4. JavaScript / TypeScript
    const jsKeywords = /\b(const|let|var|function|return|import|export|from|class|extends|async|await|try|catch|finally|throw|typeof|instanceof|switch|case|default|if|else|for|while|do)\b/;
    const jsPatterns = /(?:=>|\bconsole\.(?:log|error|warn)\b|\bdocument\.(?:querySelector|getElementById)\b|\bwindow\.|\bmodule\.exports\b)/;
    const jsStructure = /\b(?:function\s*[a-zA-Z0-9_$]*\s*\(|\([a-zA-Z0-9_$,\s]*\)\s*=>|const\s+[a-zA-Z0-9_$]+\s*=|let\s+[a-zA-Z0-9_$]+\s*=)/;

    let jsScore = 0;
    if (jsKeywords.test(trimmed)) jsScore += 2;
    if (jsPatterns.test(trimmed)) jsScore += 3;
    if (jsStructure.test(trimmed)) jsScore += 3;
    if (/[{}();]/.test(trimmed) && jsScore >= 3) {
        return 'javascript';
    }

    return null;
}

function showError(message) {
    titleEl.textContent = 'Error';
    contentEl.innerHTML = `<p class="error-message">${escapeHTML(message)}</p>`;
    contentEl.classList.remove('content-loading');
    controlsEl.style.display = 'none';
}

function renderCodeBlock(codeText, lang) {
    const highlightedHtml = SyntaxHighlighter.highlight(codeText, lang);
    const lines = highlightedHtml.split('\n');
    const totalLines = lines.length;

    let lineNumbersHtml = '';
    for (let i = 1; i <= totalLines; i++) {
        lineNumbersHtml += `<span class="line-number">${i}</span>\n`;
    }

    contentEl.innerHTML = `
        <div class="code-wrapper">
            <div class="line-numbers-gutter">${lineNumbersHtml}</div>
            <pre class="code-block language-${lang}"><code>${highlightedHtml}</code></pre>
        </div>
    `;
}

function handleCopy() {
    if (!currentItem) return;

    const isImage = currentItem.text.startsWith(IMAGE_URL_PREFIX);
    const textToCopy = isImage ? currentItem.text.substring(IMAGE_URL_PREFIX.length) : (isBeautified ? rawCodeText : currentItem.text);

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback to background offscreen writing
        chrome.runtime.sendMessage({ action: "writeClipboard", text: textToCopy }, (res) => {
            if (res && res.success) {
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('copied');
                }, 1500);
            } else {
                alert('Could not copy text to clipboard.');
            }
        });
    });
}

function handleDelete() {
    if (!currentItem) return;

    if (confirm('Are you sure you want to permanently delete this item?')) {
        chrome.runtime.sendMessage({ action: "deleteItem", itemId: currentItem.id }, (response) => {
            if (chrome.runtime.lastError || !response || !response.success) {
                alert('Failed to delete item: ' + (response?.error || chrome.runtime.lastError?.message || 'Unknown error'));
            } else {
                titleEl.textContent = 'Item Deleted';
                contentEl.innerHTML = '<p class="delete-success-message">This item has been successfully deleted. This tab will now close.</p>';
                controlsEl.style.display = 'none';
                setTimeout(() => window.close(), 1500);
            }
        });
    }
}

function handleFormat() {
    if (!detectedLanguage) return;

    if (!isBeautified) {
        rawCodeText = Beautifier.format(currentItem.text, detectedLanguage);
        renderCodeBlock(rawCodeText, detectedLanguage);
        formatBtn.textContent = 'Original Code';
        isBeautified = true;
    } else {
        rawCodeText = currentItem.text;
        renderCodeBlock(rawCodeText, detectedLanguage);
        formatBtn.textContent = 'Format Code';
        isBeautified = false;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Sync theme
    chrome.runtime.sendMessage({ action: "getTheme" }, (res) => {
        if (res && res.success) applyTheme(res.theme);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.clipboardTheme) {
            applyTheme(changes.clipboardTheme.newValue);
        }
    });

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        showError('No item ID provided in the URL.');
        return;
    }

    try {
        const data = await chrome.storage.local.get('clipboardHistory');
        const history = data.clipboardHistory || [];
        currentItem = history.find(item => item.id === itemId);

        if (!currentItem) {
            showError('Item not found. It may have been deleted already.');
            return;
        }

        const isImage = currentItem.text.startsWith(IMAGE_URL_PREFIX);
        const byteSize = getItemByteSize(currentItem.text);
        const formattedSize = formatBytes(byteSize);
        const charCount = currentItem.text.length;

        if (isImage) {
            const imageUrl = currentItem.text.substring(IMAGE_URL_PREFIX.length);
            const isDataUrl = imageUrl.startsWith("data:");
            titleEl.textContent = isDataUrl ? 'Data URL Image' : 'Remote Image';

            contentEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Saved Image';
            img.className = 'viewer-image';
            contentEl.appendChild(img);
        } else {
            detectedLanguage = detectCodeLanguage(currentItem.text);

            if (detectedLanguage) {
                titleEl.textContent = 'Code Snippet';
                badgeLang.textContent = detectedLanguage;
                badgeLang.style.display = 'inline-block';
                formatBtn.style.display = 'inline-block';
                formatBtn.addEventListener('click', handleFormat);

                rawCodeText = currentItem.text;
                renderCodeBlock(rawCodeText, detectedLanguage);
            } else {
                titleEl.textContent = 'Text Snippet';
                contentEl.innerHTML = `<pre class="plain-text">${escapeHTML(currentItem.text)}</pre>`;
            }
        }

        contentEl.classList.remove('content-loading');

        const date = new Date(currentItem.timestamp);
        metaEl.textContent = `Saved on: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()} • Size: ${formattedSize} (${byteSize.toLocaleString()} bytes, ${charCount.toLocaleString()} chars) • ID: ${currentItem.id}`;

        copyBtn.addEventListener('click', handleCopy);
        deleteBtn.addEventListener('click', handleDelete);

    } catch (err) {
        console.error('Error loading item:', err);
        showError('Failed to load item from storage.');
    }
});
