# ClipMaster 📋✨

[![Version](https://img.shields.io/badge/version-8.5.0-blue.svg)](https://chromewebstore.google.com/detail/clipmaster/gopagdmpgfbgklmckanjgpdcdkemipkl)
[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-ClipMaster-success.svg)](https://chromewebstore.google.com/detail/clipmaster/gopagdmpgfbgklmckanjgpdcdkemipkl)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-gokuthug1.github.io%2FClipMaster-purple.svg)](https://gokuthug1.github.io/ClipMaster/)

**ClipMaster** is a beautifully remastered, high-performance floating clipboard manager for Google Chrome. Seamlessly summon a glassmorphism floating window anywhere on any webpage, search through up to 5,000 clipboard clips in real-time, view code snippets with syntax highlighting and auto-beautification, and save images locally as offline Data URLs.

---

## 🚀 Features

- 🪟 **Floating & Unintrusive Glassmorphism UI**: Draggable, resizable, and minimizable with viewport edge-clamping so it never gets lost off-screen.
- ⚡ **Instant Summon (`Alt + C`)**: Press `Alt + C` anywhere to toggle the floating window without taking your hands off the keyboard.
- 🎨 **Code Syntax Highlighting**: Auto-detects JavaScript, TypeScript, HTML, CSS, and JSON with line numbers and a dedicated syntax viewer tab.
- 🧹 **Code Beautifier**: One-click format/beautify button for unminifying or structuring messy code snippets.
- 🖼️ **Offline Data URL Image Conversion**: Converts web images into standalone Base64 and SVG Data URLs so you never lose them even if the remote site takes them down.
- 🔍 **Instant Search & Filter**: Real-time filtering across thousands of clips with byte-size tracking and time elapsed timestamps.
- 📌 **Pin Important Clips**: Keep frequently used credentials, addresses, or snippets pinned permanently to the top.
- 💾 **Local Backup (Export & Import JSON)**: Easily export your entire history to a JSON backup and import/merge across devices.
- 🔒 **100% Private & Offline**: Zero telemetry, zero external trackers, and zero third-party servers. All data stays strictly in Chrome's local sandbox (`chrome.storage.local` with `unlimitedStorage`).
- 🌓 **Dark Mode**: Flawless dark and light theme switching.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Alt</kbd> + <kbd>C</kbd> | Toggle ClipMaster Floating Window |
| <kbd>Esc</kbd> | Dismiss Floating Window |
| <kbd>Click Row</kbd> | Instantly copy clip back to clipboard |
| <kbd>Enter</kbd> in Quick-Add | Save custom snippet or note |

---

## 📦 Installation

### From Chrome Web Store
Install the official extension directly from the Chrome Web Store:
👉 **[Download ClipMaster on Chrome Web Store](https://chromewebstore.google.com/detail/clipmaster/gopagdmpgfbgklmckanjgpdcdkemipkl)**

### Load Unpacked (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/gokuthug1/ClipMaster.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the cloned directory.

---

## 🛠️ Project Structure

```
ClipMaster/
├── manifest.json         # Extension Manifest V3 configuration
├── background.js        # Service Worker (lifecycle, context menus, offscreen bridge)
├── floating_ui.js       # Injected floating clipboard window script
├── floating_ui.css      # Glassmorphism UI styles (scoped)
├── view.html            # Detail snippet & image viewer page
├── view.js              # Viewer logic, line numbers & language detection
├── view.css             # Code viewer styling & dark mode tokens
├── highlighter.js       # Fast regex-based syntax lexer (JS, HTML, CSS, JSON)
├── beautifier.js        # Native code formatter
├── offscreen.html       # Offscreen clipboard DOM container
├── offscreen.js         # Offscreen clipboard read/write bridge
├── settings.html        # Extension settings page
├── settings.js          # Settings controller & JSON export/import
├── settings.css         # Settings page styles
├── icons/               # Extension icons & QR codes
│   ├── c16.png
│   ├── c48.png
│   ├── c128.png
│   └── QR.svg
├── index.html           # Official Website (GitHub Pages)
└── privacy.html         # Privacy Policy
```

---

## 🔒 Privacy & Permissions

ClipMaster is committed to local-first privacy:
- `storage` & `unlimitedStorage`: Saves your clips and preferences locally on your machine.
- `clipboardRead`: Enables reading and pasting clipboard snippets.
- `notifications`: Optional desktop toasts when items are copied.
- `contextMenus`: Right-click shortcuts to add selected text or images.
- `scripting` & `activeTab`: Injects the floating floater into your active tab upon summon.

Read our full [Privacy Policy](https://gokuthug1.github.io/ClipMaster/privacy.html).

---

## 💖 Support Development

If you enjoy using ClipMaster, donations help support ongoing updates:
- **Cash App**: [$gokuthug1](https://cash.app/$gokuthug1)

---

## 📄 License

MIT License. Copyright &copy; 2026 ClipMaster.
