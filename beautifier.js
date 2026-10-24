/**
 * beautifier.js - ClipMaster Native Code Formatter (v8.5)
 * Formats HTML, CSS, JavaScript, and JSON with clean indentation.
 */
const Beautifier = {
    format(code, type) {
        if (!code || typeof code !== 'string') return '';
        if (code.length > 2000000) return code; // 2MB limit for formatting
        
        type = (type || 'js').toLowerCase();
        if (type === 'html' || type === 'htm') return this.formatHTML(code);
        if (type === 'css') return this.formatCSS(code);
        if (type === 'json') {
            try { return JSON.stringify(JSON.parse(code), null, 4); } catch (e) { return code; }
        }
        return this.formatJS(code);
    },

    formatHTML(html) {
        let formatted = '';
        let indent = 0;
        const tab = '    ';
        const inlineTags = new Set(['a', 'span', 'b', 'i', 'u', 'strong', 'em', 'abbr', 'code', 'mark', 'small', 'sub', 'sup']);
        const voidTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr', '!doctype']);

        const tokens = [];
        let i = 0;
        while (i < html.length) {
            if (html.substring(i, i + 4) === '<!--') {
                let end = html.indexOf('-->', i);
                if (end === -1) end = html.length;
                else end += 3;
                tokens.push({ type: 'comment', val: html.substring(i, end) });
                i = end;
                continue;
            }
            
            if (html[i] === '<') {
                let end = i + 1;
                let inString = false;
                let strChar = '';
                while (end < html.length) {
                    let c = html[end];
                    let backslashCount = 0;
                    let k = end - 1;
                    while (k >= 0 && html[k] === '\\') { backslashCount++; k--; }
                    let isEscaped = (backslashCount % 2 === 1);

                    if (!isEscaped && !inString && (c === '"' || c === "'")) { 
                        inString = true; strChar = c; 
                    } else if (!isEscaped && inString && c === strChar) { 
                        inString = false; 
                    } else if (!inString && c === '>') { 
                        end++; break; 
                    }
                    end++;
                }
                let tagStr = html.substring(i, end);
                let isClosing = tagStr.startsWith('</');
                let isSelfClosing = tagStr.endsWith('/>');
                let tagNameMatch = tagStr.match(/<\/?([a-zA-Z0-9\-!]+)/);
                let tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
                
                tokens.push({ type: 'tag', val: tagStr, name: tagName, isClosing, isSelfClosing });
                i = end;

                if (!isClosing && !isSelfClosing && (tagName === 'script' || tagName === 'style')) {
                    const closeTag = `</${tagName}`;
                    let closeIndex = html.toLowerCase().indexOf(closeTag, i);
                    if (closeIndex !== -1) {
                        let rawContent = html.substring(i, closeIndex);
                        if (rawContent.trim()) {
                            tokens.push({ type: 'rawText', val: rawContent, lang: tagName === 'script' ? 'js' : 'css' });
                        }
                        i = closeIndex;
                    }
                }
                continue;
            }
            
            let end = html.indexOf('<', i);
            if (end === -1) end = html.length;
            let text = html.substring(i, end);
            if (text.trim()) tokens.push({ type: 'text', val: text.trim().replace(/\s+/g, ' ') });
            i = end;
        }

        tokens.forEach((token, index) => {
            if (token.type === 'comment') {
                formatted += '\n' + tab.repeat(indent) + token.val;
                return;
            }

            if (token.type === 'rawText') {
                const subFormatted = token.lang === 'js' ? this.formatJS(token.val) : this.formatCSS(token.val);
                formatted += '\n' + subFormatted.split('\n').map(l => tab.repeat(indent + 1) + l).join('\n');
                return;
            }

            if (token.type === 'text') {
                let prev = tokens[index - 1];
                let isInline = prev && prev.type === 'tag' && inlineTags.has(prev.name);
                formatted += (isInline ? ' ' : '\n' + tab.repeat(indent)) + token.val;
                return;
            }

            if (token.isClosing) {
                indent = Math.max(0, indent - 1);
                formatted += (inlineTags.has(token.name) ? '' : '\n' + tab.repeat(indent)) + token.val;
            } else {
                let prev = tokens[index - 1];
                let isInline = inlineTags.has(token.name) && prev && prev.type !== 'tag';
                formatted += (isInline ? ' ' : '\n' + tab.repeat(indent)) + token.val;

                if (!token.isSelfClosing && !voidTags.has(token.name) && !token.val.startsWith('<!')) {
                    indent++;
                }
            }
        });

        return formatted.trim();
    },

    formatCSS(css) {
        let formatted = '';
        let indent = 0;
        const tab = '    ';
        let inString = false, strChar = '';
        let inComment = false;
        let inParen = 0;

        for (let i = 0; i < css.length; i++) {
            let char = css[i], next = css[i+1] || '';
            let backslashCount = 0;
            let k = i - 1;
            while (k >= 0 && css[k] === '\\') { backslashCount++; k--; }
            let isEscaped = (backslashCount % 2 === 1);

            if (!inString && !inComment && char === '/' && next === '*') {
                inComment = true;
                formatted += '\n' + tab.repeat(indent) + '/*';
                i++; continue;
            }
            if (inComment && char === '*' && next === '/') {
                inComment = false;
                formatted += '*/\n' + tab.repeat(indent);
                i++; continue;
            }
            if (inComment) { formatted += char; continue; }

            if ((char === '"' || char === "'") && !isEscaped) {
                if (!inString) { inString = true; strChar = char; }
                else if (char === strChar) { inString = false; }
                formatted += char;
                continue;
            }
            if (inString) { formatted += char; continue; }

            if (char === '(') inParen++;
            if (char === ')') inParen = Math.max(0, inParen - 1);

            if (char === '{') {
                formatted = formatted.trimEnd() + ' {\n' + tab.repeat(++indent);
            } else if (char === '}') {
                indent = Math.max(0, indent - 1);
                formatted = formatted.trimEnd() + '\n' + tab.repeat(indent) + '}\n' + tab.repeat(indent);
            } else if (char === ';') {
                formatted += char;
                if (inParen === 0) formatted += '\n' + tab.repeat(indent);
            } else if (char === ',') {
                formatted += char;
                if (inParen === 0) formatted += ' ';
            } else {
                formatted += char;
            }
        }
        return formatted.replace(/\n\s*\n/g, '\n').trim();
    },

    formatJS(js) {
        let formatted = '';
        let indent = 0;
        const tab = '    ';
        const stateStack = [];
        let inParen = 0;

        for (let i = 0; i < js.length; i++) {
            let char = js[i], next = js[i+1] || '';
            let backslashCount = 0;
            let k = i - 1;
            while (k >= 0 && js[k] === '\\') { backslashCount++; k--; }
            let isEscaped = (backslashCount % 2 === 1);
            let state = stateStack[stateStack.length - 1] || null;

            if (state && state.type === 'line-comment') {
                if (char === '\n') {
                    stateStack.pop();
                    formatted += '\n' + tab.repeat(indent);
                } else { formatted += char; }
                continue;
            }

            if (state && state.type === 'block-comment') {
                if (char === '*' && next === '/') {
                    stateStack.pop();
                    formatted += '*/\n' + tab.repeat(indent);
                    i++;
                } else { formatted += char; }
                continue;
            }

            if (state && (state.type === 'double-quote' || state.type === 'single-quote')) {
                formatted += char;
                if (!isEscaped) {
                    if (state.type === 'double-quote' && char === '"') stateStack.pop();
                    else if (state.type === 'single-quote' && char === "'") stateStack.pop();
                }
                continue;
            }

            if (state && state.type === 'template-literal') {
                if (!isEscaped && char === '$' && next === '{') {
                    stateStack.push({ type: 'interpolation', braceDepth: 1 });
                    formatted += '${';
                    i++; 
                } else if (!isEscaped && char === '`') {
                    stateStack.pop();
                    formatted += char;
                } else { formatted += char; }
                continue;
            }

            if (state && state.type === 'regex') {
                formatted += char;
                if (!isEscaped && char === '/') stateStack.pop();
                continue;
            }

            if (char === '/' && next === '/') {
                stateStack.push({ type: 'line-comment' });
                formatted += '//'; i++; continue;
            }
            if (char === '/' && next === '*') {
                stateStack.push({ type: 'block-comment' });
                formatted += '/*'; i++; continue;
            }

            if (char === '"') { stateStack.push({ type: 'double-quote' }); formatted += char; continue; }
            if (char === "'") { stateStack.push({ type: 'single-quote' }); formatted += char; continue; }
            if (char === '`') { stateStack.push({ type: 'template-literal' }); formatted += char; continue; }

            if (char === '/' && next !== '/' && next !== '*') {
                if (/(?:[=:(,;&|!<>?[{}\n]|return|case|typeof|yield|await)\s*$/.test(formatted) || formatted.trim() === '') {
                    stateStack.push({ type: 'regex' });
                    formatted += char;
                    continue;
                }
            }

            if (char === '{') {
                if (state && state.type === 'interpolation') state.braceDepth++;
                indent++;
                formatted = formatted.trimEnd() + ' {\n' + tab.repeat(indent);
                continue;
            }

            if (char === '}') {
                if (state && state.type === 'interpolation') {
                    state.braceDepth--;
                    if (state.braceDepth === 0) {
                        stateStack.pop();
                        formatted = formatted.trimEnd() + '}';
                        continue;
                    }
                }
                indent = Math.max(0, indent - 1);
                formatted = formatted.trimEnd() + '\n' + tab.repeat(indent) + '}';
                continue;
            }

            if (char === '(') { inParen++; formatted += char; continue; }
            if (char === ')') { inParen = Math.max(0, inParen - 1); formatted += char; continue; }

            if (char === ';') {
                formatted += ';';
                if (inParen === 0) formatted += '\n' + tab.repeat(indent);
                continue;
            }

            if (char === '\n') {
                if (!formatted.endsWith('\n') && js[i-1] !== ' ') formatted += '\n' + tab.repeat(indent);
                continue;
            }

            if (char === ' ' || char === '\t') {
                if (!formatted.endsWith(' ') && !formatted.endsWith('\n')) formatted += ' ';
                continue;
            }

            formatted += char;
        }
        return formatted.trim();
    }
};

if (typeof globalThis !== 'undefined') globalThis.Beautifier = Beautifier;
if (typeof window !== 'undefined') window.Beautifier = Beautifier;
if (typeof module !== 'undefined' && module.exports) module.exports = Beautifier;
