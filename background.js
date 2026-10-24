// background.js - ClipMaster Service Worker (v8.5 - Peak Edition)

const MAX_HISTORY_ITEMS = 5000;
const STORAGE_KEY = "clipboardHistory";
const THEME_KEY = "clipboardTheme";
const SETTINGS_KEY = "clipmasterSettings";
const FLOATER_POS_KEY = "clipmasterFloaterPosition";
const IMAGE_URL_PREFIX = "IMG_URL::";

const CONTEXT_MENU_ID_ADD_TEXT = "clipmasterAddSelectedText";
const CONTEXT_MENU_ID_ADD_IMAGE = "clipmasterAddImage";
const CONTEXT_MENU_ID_OPEN_FLOATER = "clipmasterOpenFloater";

const DEFAULT_SETTINGS = {
    width: 380,
    maxHeight: 600,
    hideDonations: false,
    saveImagesAsDataUrl: false,
    enableNotifications: true
};

// --- Offscreen Document Lifecycle ---
let creatingOffscreenPromise = null;

async function ensureOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    if ('getContexts' in chrome.runtime) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [offscreenUrl]
        });
        if (contexts.length > 0) return;
    } else if (chrome.offscreen && chrome.offscreen.hasDocument) {
        if (await chrome.offscreen.hasDocument()) return;
    }

    if (creatingOffscreenPromise) {
        await creatingOffscreenPromise;
        return;
    }

    try {
        creatingOffscreenPromise = chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['CLIPBOARD'],
            justification: 'Manage clipboard read and write operations for ClipMaster'
        });
        await creatingOffscreenPromise;
    } catch (err) {
        if (!err.message?.includes('Only a single offscreen document may be created')) {
            console.warn("BG: Error creating offscreen document:", err);
        }
    } finally {
        creatingOffscreenPromise = null;
    }
}

// --- Image to Data URL Conversion Helper ---
async function convertImageToDataUrl(srcUrl) {
    if (!srcUrl) return srcUrl;
    if (srcUrl.startsWith("data:")) return srcUrl;

    try {
        const response = await fetch(srcUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (blob.size > 15 * 1024 * 1024) {
            console.warn("BG: Image exceeds 15MB, retaining remote URL");
            return srcUrl;
        }

        const mimeType = (blob.type || "").toLowerCase();

        // SVG Support
        if (mimeType.includes("svg") || srcUrl.toLowerCase().includes(".svg")) {
            const svgText = await blob.text();
            return `data:image/svg+xml,${encodeURIComponent(svgText)}`;
        }

        // Raster Formats (PNG, JPEG, GIF, WEBP, AVIF, ICO)
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
        }
        const base64 = btoa(binary);
        const finalMime = mimeType || 'image/png';
        return `data:${finalMime};base64,${base64}`;
    } catch (err) {
        console.warn("BG: Failed to convert image to Data URL, fallback to raw URL:", err);
        return srcUrl;
    }
}

// --- Core History Storage ---
async function getHistory() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        return data[STORAGE_KEY] || [];
    } catch (e) {
        console.error("BG: Error getHistory:", e);
        return [];
    }
}

async function getStoredSettings() {
    try {
        const data = await chrome.storage.local.get(SETTINGS_KEY);
        return { ...DEFAULT_SETTINGS, ...(data[SETTINGS_KEY] || {}) };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

async function saveHistory(history) {
    if (!Array.isArray(history)) return;

    history.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.timestamp || 0) - (a.timestamp || 0);
    });

    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: history });
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "historyUpdated" }).catch(() => {});
                }
            });
        });
    } catch (e) {
        console.error("BG: Error saveHistory:", e);
    }
}

async function notifyUser(message, title = "ClipMaster") {
    try {
        const settings = await getStoredSettings();
        if (settings.enableNotifications === false) return;

        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/c48.png",
            title: title,
            message: message,
            priority: 0,
            silent: true
        }, (nid) => {
            if (nid && !chrome.runtime.lastError) {
                setTimeout(() => {
                    chrome.notifications.clear(nid).catch(() => {});
                }, 2200);
            }
        });
    } catch (err) {
        // Ignore notification errors
    }
}

async function addTextToHistory(text, source = "unknown") {
    if (!text || typeof text !== "string" || text.trim() === "") return;

    let history = await getHistory();
    const existingIndex = history.findIndex(item => item.text === text);

    if (existingIndex !== -1) {
        let existingItem = history.splice(existingIndex, 1)[0];
        existingItem.timestamp = Date.now();
        history.unshift(existingItem);
    } else {
        history.unshift({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: text,
            timestamp: Date.now(),
            pinned: false
        });
    }

    await saveHistory(history);

    const message = text.startsWith(IMAGE_URL_PREFIX) ? "Image saved to clipboard!" : "Text snippet saved!";
    notifyUser(message);
}

// --- Import & Merge Logic ---
async function mergeHistory(incomingData) {
    if (!Array.isArray(incomingData)) throw new Error("Invalid format: expected array");
    let current = await getHistory();
    let merged = [...current];

    incomingData.forEach(incItem => {
        if (!incItem || !incItem.text) return;
        const exists = merged.find(c => c.text === incItem.text);
        if (!exists) {
            merged.push({
                id: incItem.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: incItem.text,
                timestamp: incItem.timestamp || Date.now(),
                pinned: !!incItem.pinned
            });
        } else {
            if (incItem.pinned && !exists.pinned) exists.pinned = true;
        }
    });

    await saveHistory(merged);
    return merged;
}

// --- Context Menus ---
function setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            console.warn("ContextMenus removeAll error:", chrome.runtime.lastError);
        }

        chrome.contextMenus.create({
            id: CONTEXT_MENU_ID_OPEN_FLOATER,
            title: "Open ClipMaster (Alt+C)",
            contexts: ["page", "action", "selection", "image", "link", "editable"]
        }, () => { if (chrome.runtime.lastError) {} });

        chrome.contextMenus.create({
            id: CONTEXT_MENU_ID_ADD_TEXT,
            title: "Add selection to ClipMaster",
            contexts: ["selection"]
        }, () => { if (chrome.runtime.lastError) {} });

        chrome.contextMenus.create({
            id: CONTEXT_MENU_ID_ADD_IMAGE,
            title: "Add image to ClipMaster",
            contexts: ["image"]
        }, () => { if (chrome.runtime.lastError) {} });
    });
}

// --- Injection & Toggle Helper ---
function isRestrictedUrl(url) {
    if (!url) return true;
    const restrictedPrefixes = [
        "chrome://",
        "chrome-extension://",
        "edge://",
        "about:",
        "view-source:",
        "https://chromewebstore.google.com",
        "https://chrome.google.com/webstore"
    ];
    return restrictedPrefixes.some(prefix => url.startsWith(prefix));
}

async function injectAndToggleUI(tab) {
    if (!tab || !tab.id) return;

    if (isRestrictedUrl(tab.url)) {
        notifyUser("ClipMaster cannot attach to browser internal pages or Web Store. Please open any standard webpage!", "ClipMaster Notice");
        return;
    }

    try {
        await chrome.tabs.sendMessage(tab.id, { action: "toggleFloater" });
    } catch (e) {
        try {
            await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["floating_ui.css"] });
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["floating_ui.js"] });
            await chrome.tabs.sendMessage(tab.id, { action: "toggleFloater" });
        } catch (err) {
            console.error("BG: Failed to inject UI:", err);
            notifyUser("Could not open floater on this tab. Please refresh the page.", "ClipMaster Error");
        }
    }
}

// --- Event Listeners ---
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [THEME_KEY]: 'light',
            [SETTINGS_KEY]: DEFAULT_SETTINGS,
            [FLOATER_POS_KEY]: { top: '40px', left: '40px' }
        });
    }
    setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    setupContextMenus();
});

// Keyboard Commands listener (Alt+C)
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-floater") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) await injectAndToggleUI(tab);
    }
});

// Extension Action Click (Browser Toolbar Icon)
chrome.action.onClicked.addListener(injectAndToggleUI);

// Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case CONTEXT_MENU_ID_ADD_TEXT:
            if (info.selectionText) {
                await addTextToHistory(info.selectionText.trim(), "context_menu_selection");
            }
            break;
        case CONTEXT_MENU_ID_ADD_IMAGE:
            if (info.srcUrl) {
                const settings = await getStoredSettings();
                let imagePayload = info.srcUrl;
                if (settings.saveImagesAsDataUrl) {
                    imagePayload = await convertImageToDataUrl(info.srcUrl);
                }
                await addTextToHistory(`${IMAGE_URL_PREFIX}${imagePayload}`, "context_menu_image");
            }
            break;
        case CONTEXT_MENU_ID_OPEN_FLOATER:
            if (tab) await injectAndToggleUI(tab);
            break;
    }
});

// Runtime Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.action) {
                case "getHistory":
                    sendResponse({ success: true, history: await getHistory() });
                    break;

                case "addItem":
                case "addText":
                    if (request.text) {
                        await addTextToHistory(request.text, request.source || "manual_add");
                        sendResponse({ success: true, history: await getHistory() });
                    } else {
                        sendResponse({ success: false, error: "Empty content." });
                    }
                    break;

                case "deleteItem": {
                    let hd = await getHistory();
                    const target = hd.find(i => i.id === request.itemId);
                    if (target?.pinned) {
                        sendResponse({ success: false, error: "Pinned items cannot be deleted directly. Unpin first." });
                    } else {
                        await saveHistory(hd.filter(i => i.id !== request.itemId));
                        sendResponse({ success: true, history: await getHistory() });
                    }
                    break;
                }

                case "togglePin": {
                    let hp = await getHistory();
                    let tip = hp.find(i => i.id === request.itemId);
                    if (tip) tip.pinned = !tip.pinned;
                    await saveHistory(hp);
                    sendResponse({ success: true, history: await getHistory() });
                    break;
                }

                case "clearAllUnpinned": {
                    const pinnedOnly = (await getHistory()).filter(i => i.pinned);
                    await saveHistory(pinnedOnly);
                    sendResponse({ success: true, history: pinnedOnly });
                    break;
                }

                case "deleteAllItems":
                    await saveHistory([]);
                    sendResponse({ success: true, history: [] });
                    break;

                case "getSettings":
                    sendResponse({ success: true, settings: await getStoredSettings() });
                    break;

                case "saveSettings": {
                    await chrome.storage.local.set({ [SETTINGS_KEY]: request.settings });
                    chrome.tabs.query({}, tabs => {
                        tabs.forEach(t => {
                            if (t.id) chrome.tabs.sendMessage(t.id, { action: "settingsUpdated", settings: request.settings }).catch(() => {});
                        });
                    });
                    sendResponse({ success: true });
                    break;
                }

                case "getTheme": {
                    const data = await chrome.storage.local.get(THEME_KEY);
                    sendResponse({ success: true, theme: data[THEME_KEY] || "light" });
                    break;
                }

                case "setTheme": {
                    await chrome.storage.local.set({ [THEME_KEY]: request.theme });
                    chrome.tabs.query({}, tabs => {
                        tabs.forEach(t => {
                            if (t.id) chrome.tabs.sendMessage(t.id, { action: "themeChanged", theme: request.theme }).catch(() => {});
                        });
                    });
                    sendResponse({ success: true });
                    break;
                }

                case "openSettingsPage":
                    chrome.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;

                case "openNewTab":
                    if (request.url) chrome.tabs.create({ url: request.url });
                    sendResponse({ success: true });
                    break;

                case "getFloaterPosition": {
                    const posData = await chrome.storage.local.get(FLOATER_POS_KEY);
                    sendResponse({ success: true, position: posData[FLOATER_POS_KEY] });
                    break;
                }

                case "saveFloaterPosition":
                    await chrome.storage.local.set({ [FLOATER_POS_KEY]: request.position });
                    sendResponse({ success: true });
                    break;

                case "importHistory":
                    await mergeHistory(request.data);
                    sendResponse({ success: true, history: await getHistory() });
                    break;

                case "readClipboard":
                    await ensureOffscreenDocument();
                    chrome.runtime.sendMessage({ type: "readClipboardFromOffscreen" }, (offscreenRes) => {
                        if (chrome.runtime.lastError || !offscreenRes) {
                            sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Failed to read clipboard" });
                        } else {
                            sendResponse(offscreenRes);
                        }
                    });
                    break;

                case "writeClipboard":
                    await ensureOffscreenDocument();
                    chrome.runtime.sendMessage({ type: "writeToClipboardOffscreen", text: request.text }, (offscreenRes) => {
                        if (chrome.runtime.lastError || !offscreenRes) {
                            sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Failed to write clipboard" });
                        } else {
                            sendResponse(offscreenRes);
                        }
                    });
                    break;

                default:
                    sendResponse({ success: false, error: "Unknown action" });
                    break;
            }
        } catch (e) {
            console.error("BG: Message handler error:", e);
            sendResponse({ success: false, error: e.message });
        }
    })();
    return true;
});
