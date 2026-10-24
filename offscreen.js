// offscreen.js - ClipMaster Offscreen Clipboard Bridge (v8.5)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'readClipboardFromOffscreen') {
        (async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    sendResponse({ success: true, text: text || "" });
                } else {
                    throw new Error("navigator.clipboard.readText unavailable");
                }
            } catch (err) {
                // Fallback attempt via textarea paste
                try {
                    const textArea = document.createElement("textarea");
                    textArea.style.position = "fixed";
                    textArea.style.opacity = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    const success = document.execCommand('paste');
                    const text = textArea.value;
                    document.body.removeChild(textArea);
                    if (success && text) {
                        sendResponse({ success: true, text: text });
                    } else {
                        sendResponse({ success: false, error: err.message });
                    }
                } catch (fallbackErr) {
                    sendResponse({ success: false, error: fallbackErr.message });
                }
            }
        })();
        return true;
    } else if (request.type === 'writeToClipboardOffscreen') {
        (async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(request.text || "");
                    sendResponse({ success: true });
                } else {
                    throw new Error("navigator.clipboard.writeText unavailable");
                }
            } catch (err) {
                // Fallback attempt via textarea copy
                try {
                    const textArea = document.createElement("textarea");
                    textArea.style.position = "fixed";
                    textArea.style.opacity = "0";
                    textArea.value = request.text || "";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) {
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: "Offscreen execCommand('copy') failed" });
                    }
                } catch (execErr) {
                    sendResponse({ success: false, error: execErr.message });
                }
            }
        })();
        return true;
    }
});
