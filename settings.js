// settings.js - ClipMaster Settings Page (v8.5 - Peak Edition)

const widthSlider = document.getElementById('floaterWidth');
const heightSlider = document.getElementById('floaterMaxHeight');
const widthValueSpan = document.getElementById('widthValue');
const heightValueSpan = document.getElementById('heightValue');
const statusMsg = document.getElementById('status-message');
const hideDonationsToggle = document.getElementById('hideDonations');
const saveImagesAsDataUrlToggle = document.getElementById('saveImagesAsDataUrl');
const enableNotificationsToggle = document.getElementById('enableNotifications');
const donationCard = document.getElementById('donation-card-container');
const versionBadge = document.getElementById('extension-version');
const storageStatsText = document.getElementById('storage-stats-text');

let saveTimeout;

function handleSliderInput() {
    widthValueSpan.textContent = `${widthSlider.value}px`;
    heightValueSpan.textContent = `${heightSlider.value}px`;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSettings, 200);
}

widthSlider.addEventListener('input', handleSliderInput);
heightSlider.addEventListener('input', handleSliderInput);

hideDonationsToggle.addEventListener('change', () => {
    saveSettings();
    showStatus("Settings updated!", "var(--primary-color)");
});

saveImagesAsDataUrlToggle.addEventListener('change', () => {
    saveSettings();
    showStatus("Image storage mode updated!", "var(--primary-color)");
});

enableNotificationsToggle.addEventListener('change', () => {
    saveSettings();
    showStatus("Notification preference updated!", "var(--primary-color)");
});

function updateStorageStats() {
    chrome.runtime.sendMessage({ action: "getHistory" }, res => {
        if (res && res.success && Array.isArray(res.history)) {
            const count = res.history.length;
            const pinnedCount = res.history.filter(i => i.pinned).length;
            let totalBytes = 0;
            res.history.forEach(item => {
                if (item.text) totalBytes += new TextEncoder().encode(item.text).length;
            });
            const formattedBytes = formatBytes(totalBytes);
            storageStatsText.textContent = `Current History: ${count} items saved (${pinnedCount} pinned) • ~${formattedBytes} local storage used.`;
        } else {
            storageStatsText.textContent = "Current History: 0 items saved.";
        }
    });
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
}

function loadSettings() {
    try {
        const manifest = chrome.runtime.getManifest();
        if (manifest && manifest.version && versionBadge) {
            versionBadge.textContent = `v${manifest.version}`;
        }
    } catch (e) {}

    chrome.runtime.sendMessage({ action: "getSettings" }, res => {
        if (res?.success && res.settings) {
            widthSlider.value = res.settings.width || 380;
            heightSlider.value = res.settings.maxHeight || 600;
            widthValueSpan.textContent = `${widthSlider.value}px`;
            heightValueSpan.textContent = `${heightSlider.value}px`;
            
            hideDonationsToggle.checked = !!res.settings.hideDonations;
            donationCard.style.display = hideDonationsToggle.checked ? 'none' : 'block';

            saveImagesAsDataUrlToggle.checked = !!res.settings.saveImagesAsDataUrl;
            enableNotificationsToggle.checked = res.settings.enableNotifications !== false;
        }
    });

    chrome.runtime.sendMessage({ action: "getTheme" }, res => {
        if (res?.success) applyThemeToPage(res.theme);
    });

    updateStorageStats();
}

function applyThemeToPage(theme) {
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}

function saveSettings() {
    const newSettings = { 
        width: parseInt(widthSlider.value, 10), 
        maxHeight: parseInt(heightSlider.value, 10),
        hideDonations: hideDonationsToggle.checked,
        saveImagesAsDataUrl: saveImagesAsDataUrlToggle.checked,
        enableNotifications: enableNotificationsToggle.checked
    };
    
    donationCard.style.display = hideDonationsToggle.checked ? 'none' : 'block';
    chrome.runtime.sendMessage({ action: "saveSettings", settings: newSettings });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.clipboardTheme) applyThemeToPage(changes.clipboardTheme.newValue);
        if (changes.clipboardHistory) updateStorageStats();
    }
});

// --- Local Data Export & Import ---
document.getElementById('btn-export').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "getHistory" }, res => {
        if (res?.success) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.history, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `ClipMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
            dlAnchorElem.click();
            showStatus("Backup exported successfully!", "var(--primary-color)");
        }
    });
});

const fileImport = document.getElementById('file-import');
document.getElementById('btn-import').addEventListener('click', () => fileImport.click());

fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error("JSON must be an array of items.");
            chrome.runtime.sendMessage({ action: "importHistory", data: data }, res => {
                if (res?.success) {
                    showStatus("Import merged successfully!", "var(--primary-color)");
                    updateStorageStats();
                } else {
                    showStatus("Import failed: " + (res?.error || "Unknown error"), "var(--danger-color)");
                }
            });
        } catch (err) {
            showStatus("Invalid JSON backup file.", "var(--danger-color)");
        }
    };
    reader.readAsText(file);
});

function showStatus(text, color) {
    statusMsg.textContent = text;
    statusMsg.style.color = color;
    statusMsg.style.backgroundColor = color === 'var(--danger-color)' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)';
    statusMsg.style.opacity = 1;
    setTimeout(() => { statusMsg.style.opacity = 0; }, 3200);
}

document.addEventListener('DOMContentLoaded', loadSettings);
