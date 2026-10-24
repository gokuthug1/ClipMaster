// floating_ui.js - ClipMaster Injected UI (v8.5 - Peak Edition)
(() => {
    const FLOATER_ID = 'clipmaster-floater-ui';
    const IMAGE_URL_PREFIX = "IMG_URL::";
    const DONATION_URL = "https://cash.app/$gokuthug1";

    if (window.__clipmaster_floater_initialized__) {
        const existing = document.getElementById(FLOATER_ID);
        if (existing) {
            existing.style.display = (existing.style.display === "flex") ? "none" : "flex";
        }
        return;
    }
    window.__clipmaster_floater_initialized__ = true;

    let floaterDiv = null;
    let clipboardList, searchBar, clearUnpinnedBtn, clearAllBtn, themeToggleBtn, emptyStateDiv;
    let closeBtn, minimizeBtn, settingsBtn, donateBtn, addSnippetBtn, quickAddContainer, quickAddInput, quickAddSubmit;
    let currentHistory = [];
    let isDragging = false, dragStartX = 0, dragStartY = 0, initialElemX = 0, initialElemY = 0;

    const ICONS = {
        CLIPBOARD: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
        PIN_SOLID: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 2 2 0 000-4H8a2 2 0 000 4 1 1 0 011 1v3.76z"/></svg>',
        PIN_OUTLINE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 2 2 0 000-4H8a2 2 0 000 4 1 1 0 011 1v3.76z"/></svg>',
        DELETE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>',
        VIEW: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>',
        COPY: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        CHECK: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
        THEME_LIGHT: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
        THEME_DARK: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
        CLOSE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
        SETTINGS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
        MINIMIZE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
        MAXIMIZE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
        HEART: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        SEARCH: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
        PLUS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
    };

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

    function safeSendMessage(payload, callback) {
        try {
            if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
                chrome.runtime.sendMessage(payload, (response) => {
                    if (chrome.runtime.lastError) {
                        const msg = chrome.runtime.lastError.message || "";
                        if (msg.includes("Extension context invalidated")) {
                            handleInvalidatedContext();
                        } else if (callback) {
                            callback(response);
                        }
                    } else if (callback) {
                        callback(response);
                    }
                });
            } else {
                handleInvalidatedContext();
            }
        } catch (e) {
            if (e.message && e.message.includes("Extension context invalidated")) {
                handleInvalidatedContext();
            } else {
                console.error("ClipMaster: Messaging error:", e);
            }
        }
    }

    function handleInvalidatedContext() {
        if (floaterDiv) {
            floaterDiv.remove();
            floaterDiv = null;
        }
    }

    function clampPosition(x, y, width, height) {
        const pad = 12;
        const maxW = window.innerWidth || document.documentElement.clientWidth || 800;
        const maxH = window.innerHeight || document.documentElement.clientHeight || 600;
        const left = Math.max(pad, Math.min(x, Math.max(pad, maxW - width - pad)));
        const top = Math.max(pad, Math.min(y, Math.max(pad, maxH - height - pad)));
        return { left: `${left}px`, top: `${top}px` };
    }

    function createFloaterHTML() {
        const div = document.createElement("div");
        div.id = FLOATER_ID;
        div.innerHTML = `
        <div class="cmf-header">
            <div class="cmf-brand">
                ${ICONS.CLIPBOARD}
                <h1>ClipMaster</h1>
            </div>
            <div class="cmf-header-buttons">
                <button id="cmf-add-snippet-btn" data-tooltip="Quick Add Note">${ICONS.PLUS}</button>
                <button id="cmf-donate-btn" data-tooltip="Donate / Support">${ICONS.HEART}</button>
                <button id="cmf-settings-btn" data-tooltip="Settings">${ICONS.SETTINGS}</button>
                <button id="cmf-minimize-btn" data-tooltip="Minimize">${ICONS.MINIMIZE}</button>
                <button id="cmf-theme-toggle" data-tooltip="Toggle Theme">${ICONS.THEME_DARK}</button>
                <button id="cmf-close-btn" class="cmf-close-btn" data-tooltip="Close (Esc)">${ICONS.CLOSE}</button>
            </div>
        </div>
        <div id="cmf-quick-add-container" class="cmf-quick-add-container" style="display: none;">
            <input type="text" id="cmf-quick-add-input" placeholder="Type or paste snippet and press Enter...">
            <button id="cmf-quick-add-submit" class="cmf-text-btn">Save</button>
        </div>
        <div class="cmf-toolbar">
            <div class="cmf-search-wrapper">
                <div class="cmf-search-icon">${ICONS.SEARCH}</div>
                <input type="text" id="cmf-search-bar" class="cmf-search-bar" placeholder="Search clipboard...">
            </div>
            <div class="cmf-controls">
                <button id="cmf-clear-unpinned" class="cmf-text-btn" data-tooltip="Clear Unpinned">Clear</button>
                <button id="cmf-clear-all" class="cmf-text-btn cmf-danger-btn" data-tooltip="Clear All">Clear All</button>
            </div>
        </div>
        <div class="cmf-list-container">
            <ul id="cmf-clipboard-list"></ul>
            <div id="cmf-empty-state" class="cmf-empty-state">
                ${ICONS.CLIPBOARD}
                <p>Clipboard is empty</p>
                <span>Copy text or images, or click + to add a quick note.</span>
            </div>
        </div>
        `;
        document.body.appendChild(div);
        return div;
    }

    function initializeFloater() {
        floaterDiv = document.getElementById(FLOATER_ID) || createFloaterHTML();
        if (floaterDiv.dataset.initialized !== "true") {
            clipboardList = floaterDiv.querySelector("#cmf-clipboard-list");
            searchBar = floaterDiv.querySelector("#cmf-search-bar");
            clearUnpinnedBtn = floaterDiv.querySelector("#cmf-clear-unpinned");
            clearAllBtn = floaterDiv.querySelector("#cmf-clear-all");
            themeToggleBtn = floaterDiv.querySelector("#cmf-theme-toggle");
            emptyStateDiv = floaterDiv.querySelector("#cmf-empty-state");
            closeBtn = floaterDiv.querySelector("#cmf-close-btn");
            minimizeBtn = floaterDiv.querySelector("#cmf-minimize-btn");
            settingsBtn = floaterDiv.querySelector("#cmf-settings-btn");
            donateBtn = floaterDiv.querySelector("#cmf-donate-btn");
            addSnippetBtn = floaterDiv.querySelector("#cmf-add-snippet-btn");
            quickAddContainer = floaterDiv.querySelector("#cmf-quick-add-container");
            quickAddInput = floaterDiv.querySelector("#cmf-quick-add-input");
            quickAddSubmit = floaterDiv.querySelector("#cmf-quick-add-submit");

            floaterDiv.querySelector(".cmf-header").addEventListener("mousedown", onDragStart);
            themeToggleBtn.onclick = toggleThemeHandler;
            clearUnpinnedBtn.onclick = clearUnpinnedHandler;
            clearAllBtn.onclick = clearAllHandler;
            searchBar.oninput = applyFilterAndRender;

            closeBtn.onclick = () => {
                if (floaterDiv) floaterDiv.style.display = "none";
            };
            minimizeBtn.onclick = toggleMinimizeHandler;

            settingsBtn.onclick = () => safeSendMessage({ action: "openSettingsPage" });
            donateBtn.onclick = () => safeSendMessage({ action: "openNewTab", url: DONATION_URL });

            // Quick Add Snippet handlers
            addSnippetBtn.onclick = () => {
                const isHidden = quickAddContainer.style.display === "none";
                quickAddContainer.style.display = isHidden ? "flex" : "none";
                if (isHidden) quickAddInput.focus();
            };

            const submitSnippet = () => {
                const text = quickAddInput.value.trim();
                if (text) {
                    safeSendMessage({ action: "addItem", text: text }, () => {
                        quickAddInput.value = "";
                        quickAddContainer.style.display = "none";
                        fetchHistoryAndUpdate();
                    });
                }
            };

            quickAddSubmit.onclick = submitSnippet;
            quickAddInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") submitSnippet();
                if (e.key === "Escape") quickAddContainer.style.display = "none";
            });

            // Keyboard shortcut Escape closes floater
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && floaterDiv && floaterDiv.style.display === "flex") {
                    floaterDiv.style.display = "none";
                }
            });

            floaterDiv.dataset.initialized = "true";
            loadInitialThemeAndSettings();
        }
    }

    function toggleMinimizeHandler() {
        if (floaterDiv) {
            const isMinimized = floaterDiv.classList.toggle("cmf-minimized");
            minimizeBtn.innerHTML = isMinimized ? ICONS.MAXIMIZE : ICONS.MINIMIZE;
            minimizeBtn.dataset.tooltip = isMinimized ? "Maximize" : "Minimize";
        }
    }

    function applySettings(settings) {
        if (floaterDiv && settings) {
            floaterDiv.style.width = `${settings.width || 380}px`;
            floaterDiv.style.maxHeight = `${settings.maxHeight || 600}px`;

            const donateBtnEl = floaterDiv.querySelector('#cmf-donate-btn');
            if (donateBtnEl) {
                donateBtnEl.style.display = settings.hideDonations ? "none" : "inline-flex";
            }
        }
    }

    function loadInitialThemeAndSettings() {
        safeSendMessage({ action: "getTheme" }, response => {
            if (response && response.success) applyTheme(response.theme);
        });
        safeSendMessage({ action: "getSettings" }, response => {
            if (response && response.success) applySettings(response.settings);
        });
        safeSendMessage({ action: "getFloaterPosition" }, response => {
            if (floaterDiv && response && response.success && response.position) {
                const rawLeft = parseInt(response.position.left, 10) || 40;
                const rawTop = parseInt(response.position.top, 10) || 40;
                const clamped = clampPosition(rawLeft, rawTop, floaterDiv.offsetWidth || 380, floaterDiv.offsetHeight || 400);
                floaterDiv.style.left = clamped.left;
                floaterDiv.style.top = clamped.top;
            }
        });
    }

    function onDragStart(e) {
        if (floaterDiv && !e.target.closest("button, input")) {
            const header = floaterDiv.querySelector(".cmf-header");
            if (header && header.contains(e.target)) {
                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                initialElemX = floaterDiv.offsetLeft;
                initialElemY = floaterDiv.offsetTop;
                document.addEventListener("mousemove", onDragging, { capture: true });
                document.addEventListener("mouseup", onDragEnd, { capture: true });
                document.body.style.cssText += "cursor: grabbing !important; user-select: none !important;";
                floaterDiv.style.transition = "none";
            }
        }
    }

    function onDragging(e) {
        if (isDragging && floaterDiv) {
            e.preventDefault();
            e.stopPropagation();
            const newX = initialElemX + (e.clientX - dragStartX);
            const newY = initialElemY + (e.clientY - dragStartY);
            const clamped = clampPosition(newX, newY, floaterDiv.offsetWidth, floaterDiv.offsetHeight);
            floaterDiv.style.left = clamped.left;
            floaterDiv.style.top = clamped.top;
        }
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener("mousemove", onDragging, { capture: true });
        document.removeEventListener("mouseup", onDragEnd, { capture: true });
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (floaterDiv) {
            floaterDiv.style.transition = "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s";
            const position = { left: floaterDiv.style.left, top: floaterDiv.style.top };
            safeSendMessage({ action: "saveFloaterPosition", position: position });
        }
    }

    function applyTheme(theme) {
        if (floaterDiv) {
            floaterDiv.classList.toggle("cmf-dark-mode", theme === "dark");
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = theme === "dark" ? ICONS.THEME_LIGHT : ICONS.THEME_DARK;
            }
        }
    }

    async function copyToClipboard(text, feedbackEl) {
        let copied = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                copied = true;
            } else {
                throw new Error("navigator.clipboard unavailable");
            }
        } catch (err) {
            // Fallback to background offscreen writing
            safeSendMessage({ action: "writeClipboard", text: text }, (res) => {
                if (res && res.success) {
                    triggerCopyFeedback(feedbackEl);
                }
            });
            return;
        }

        if (copied) {
            triggerCopyFeedback(feedbackEl);
        }
    }

    function triggerCopyFeedback(el) {
        if (!el) return;
        const originalHTML = el.innerHTML;
        el.innerHTML = ICONS.CHECK;
        el.classList.add("cmf-copied-active");
        setTimeout(() => {
            el.innerHTML = originalHTML;
            el.classList.remove("cmf-copied-active");
        }, 1200);
    }

    function renderHistory(filteredHistory) {
        if (!clipboardList || !emptyStateDiv) return;
        const fragment = document.createDocumentFragment();
        clipboardList.innerHTML = "";

        const hasItems = filteredHistory && filteredHistory.length > 0;
        emptyStateDiv.style.display = hasItems ? "none" : "flex";
        if (!hasItems) {
            emptyStateDiv.innerHTML = currentHistory.length === 0 ?
                `${ICONS.CLIPBOARD}<p>Clipboard is empty</p><span>Copy text or images, or click + to add a quick note.</span>` :
                `${ICONS.SEARCH}<p>No results found</p><span>Try adjusting your search query.</span>`;
        }

        clipboardList.style.display = hasItems ? "flex" : "none";

        if (hasItems) {
            filteredHistory.forEach(item => {
                const li = document.createElement("li");
                li.dataset.id = item.id;
                if (item.pinned) li.classList.add("cmf-pinned");

                const isImage = item.text.startsWith(IMAGE_URL_PREFIX);
                const imageUrl = isImage ? item.text.substring(IMAGE_URL_PREFIX.length) : "";
                const isDataUrl = isImage && imageUrl.startsWith("data:");
                const displayImageText = isDataUrl ? (imageUrl.startsWith("data:image/svg+xml") ? "SVG Image Data" : "Base64 Image Data") : imageUrl;

                const contentHTML = isImage ?
                    `<img src="${escapeHTML(imageUrl)}" alt="Preview" class="cmf-item-preview-img" onerror="this.style.display='none';"><span class="cmf-image-url-text">${escapeHTML(displayImageText)}</span>` :
                    `<span class="cmf-item-text-main">${escapeHTML(item.text)}</span>`;

                const sizeString = formatBytes(getItemByteSize(item.text));

                li.innerHTML = `
                <div class="cmf-item-content">
                    <div class="cmf-item-text-wrapper">${contentHTML}</div>
                    <span class="cmf-item-timestamp">${formatTimestamp(item.timestamp)} • ${sizeString}</span>
                </div>
                <div class="cmf-item-actions">
                    <button class="cmf-copy-item" data-tooltip="Copy">${ICONS.COPY}</button>
                    <button class="cmf-view-item" data-tooltip="View Details">${ICONS.VIEW}</button>
                    <button class="cmf-pin-item ${item.pinned ? 'cmf-pinned-active' : ''}" data-tooltip="${item.pinned ? "Unpin" : "Pin"}">${item.pinned ? ICONS.PIN_SOLID : ICONS.PIN_OUTLINE}</button>
                    <button class="cmf-delete-item" data-tooltip="Delete">${ICONS.DELETE}</button>
                </div>
                `;

                const copyBtn = li.querySelector(".cmf-copy-item");
                const viewBtn = li.querySelector(".cmf-view-item");
                const pinBtn = li.querySelector(".cmf-pin-item");
                const deleteBtn = li.querySelector(".cmf-delete-item");
                const textToCopy = isImage ? imageUrl : item.text;

                copyBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    copyToClipboard(textToCopy, copyBtn);
                });

                viewBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    viewItem(item.id);
                });

                pinBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    togglePinItem(item.id);
                });

                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteSingleItemHandler(item.id);
                });

                li.addEventListener("click", () => {
                    copyToClipboard(textToCopy, copyBtn);
                });

                fragment.appendChild(li);
            });
            clipboardList.appendChild(fragment);
        }
    }

    function applyFilterAndRender() {
        if (currentHistory) {
            const query = searchBar ? searchBar.value.toLowerCase().trim() : "";
            const filtered = query ? currentHistory.filter(t => t.text.toLowerCase().includes(query)) : currentHistory;
            renderHistory(filtered);
        }
    }

    function fetchHistoryAndUpdate() {
        safeSendMessage({ action: "getHistory" }, res => {
            if (res && res.success && Array.isArray(res.history)) {
                currentHistory = res.history;
            } else {
                currentHistory = [];
            }
            applyFilterAndRender();
        });
    }

    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatTimestamp(ts) {
        const diff = (Date.now() - ts) / 1000;
        if (diff < 5) return "just now";
        if (diff < 60) return `${Math.round(diff)}s ago`;
        const mins = diff / 60;
        if (mins < 60) return `${Math.round(mins)}m ago`;
        const hrs = mins / 60;
        if (hrs < 24) return `${Math.round(hrs)}h ago`;
        const days = hrs / 24;
        if (days < 7) return `${Math.round(days)}d ago`;
        return new Date(ts).toLocaleDateString();
    }

    function handleHistoryResponse(res, actionName) {
        if (res && res.success && Array.isArray(res.history)) {
            currentHistory = res.history;
            applyFilterAndRender();
        } else {
            console.error(`UI: ${actionName} failed.`, res);
        }
    }

    function toggleThemeHandler() {
        const newTheme = floaterDiv.classList.contains("cmf-dark-mode") ? "light" : "dark";
        applyTheme(newTheme);
        safeSendMessage({ action: "setTheme", theme: newTheme });
    }

    function deleteSingleItemHandler(id) {
        const item = currentHistory.find(t => t.id === id);
        if (item && item.pinned) {
            alert("This item is pinned. Unpin to delete.");
        } else if (confirm("Delete this clipboard item?")) {
            safeSendMessage({ action: "deleteItem", itemId: id }, res => handleHistoryResponse(res, "Delete item"));
        }
    }

    function clearUnpinnedHandler() {
        if (confirm("Clear ALL unpinned items? Pinned items will remain saved.")) {
            safeSendMessage({ action: "clearAllUnpinned" }, res => handleHistoryResponse(res, "Clear unpinned"));
        }
    }

    function clearAllHandler() {
        if (confirm("DANGER: This will delete ALL clipboard items, including pinned ones. Are you sure?")) {
            if (confirm(`FINAL CONFIRMATION: Delete all ${currentHistory.length} items forever?`)) {
                safeSendMessage({ action: "deleteAllItems" }, res => handleHistoryResponse(res, "Delete all"));
            }
        }
    }

    function togglePinItem(id) {
        safeSendMessage({ action: "togglePin", itemId: id }, res => handleHistoryResponse(res, "Pin/Unpin"));
    }

    function viewItem(id) {
        try {
            const url = chrome.runtime.getURL(`view.html?id=${id}`);
            safeSendMessage({ action: "openNewTab", url: url });
        } catch (e) {
            if (e.message && e.message.includes("Extension context invalidated")) {
                handleInvalidatedContext();
            }
        }
    }

    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case "toggleFloater":
                    if (!floaterDiv || floaterDiv.dataset.initialized !== "true") initializeFloater();
                    if (floaterDiv) {
                        if (floaterDiv.style.display === "flex") {
                            floaterDiv.style.display = "none";
                        } else {
                            loadInitialThemeAndSettings();
                            fetchHistoryAndUpdate();
                            floaterDiv.style.display = "flex";
                        }
                    }
                    break;
                case "settingsUpdated":
                    if (floaterDiv) applySettings(request.settings);
                    break;
                case "historyUpdated":
                    if (floaterDiv && floaterDiv.style.display === "flex") fetchHistoryAndUpdate();
                    break;
                case "themeChanged":
                    if (!floaterDiv) initializeFloater();
                    if (floaterDiv) applyTheme(request.theme);
                    break;
            }
        });
    } catch (e) {
        console.warn("ClipMaster: Extension context invalidated on listener setup.");
    }

    if (document.getElementById(FLOATER_ID)) initializeFloater();
})();
