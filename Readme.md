# Olamovies Shortener Bypass — Chrome Extension

![Version](https://img.shields.io/badge/version-1.2.0-blue) ![Manifest](https://img.shields.io/badge/manifest-v3-green)

A Chrome extension that automatically bypasses link shorteners used on Olamovies, redirecting you straight to the final destination without sitting through ads or countdown timers.

---

## 🚀 Features

- **Auto-bypass** on any Olamovies domain — fires the moment the page starts loading
- **Supports multiple shortener services** including `tpi.li`, `oii.la`, `cryptobullo.com`, `get2short.com`, `v2links.org`, `linksconsole.com`, `shrinkme.click`, and more
- **Header spoofing** via Declarative Net Request rules to satisfy referrer checks on protected shortener links
- **Toast notification** showing the resolved destination URL before redirecting
- **Retry page** — if a link resolution fails, a countdown page automatically retries after 5 seconds

---

## 📁 File Structure

```
├── manifest.json        # Extension manifest (MV3)
├── service_worker.js    # Background script — detects Olamovies tabs
├── content.js           # Content script — injects inject.js into the page
├── inject.js            # Core logic — decrypts URL and triggers redirect
├── backend1.js          # Cloudflare Worker — resolves various shortener links
├── backend2.js          # Cloudflare Worker — handles POST-based shorteners with CSRF tokens
├── rules_1.json         # Declarative Net Request rules for header modification
└── image.png            # Extension icon
```

---

## 🛠️ Installation (Developer Mode)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extension folder.
5. The extension is now active.

---

## ⚙️ How It Works

1. **Detection** — `service_worker.js` listens for tab updates. When a tab loads any `olamovies.*` domain, it injects `content.js`.
2. **Injection** — `content.js` injects `inject.js` into the page body.
3. **Decryption & Resolution** — `inject.js` calls `decryptData()` to extract the encoded destination URL from the page, then sends it to the Cloudflare Worker (`backend1.js`) which resolves the shortener and returns the final URL.
4. **Redirect** — The browser is redirected to the resolved final URL automatically.

### Cloudflare Workers

| Worker | Purpose |
|---|---|
| `backend1.js` | Routes requests by shortener hostname and resolves the final URL using service-specific logic (redirect following, base64 decoding, API calls, etc.) |
| `backend2.js` | Handles shortener services that require a POST request with CSRF tokens; returns a redirect or a retry countdown page on failure |

### Header Rules (`rules_1.json`)

Some shortener services validate the `Referer` header. The extension uses Chrome's Declarative Net Request API to automatically set the correct referer for services like `get2short.com`, `v2links.org`, `xdabo.com`, `linkjust.com`, and others.

---

## 🔒 Permissions

| Permission | Reason |
|---|---|
| `scripting` | Inject scripts into Olamovies tabs |
| `tabs` | Read tab URL to detect Olamovies domains |
| `webNavigation` | Listen for page load events |
| `declarativeNetRequest` | Modify request headers for shortener domains |
| `host_permissions: *://*/*` | Required to inject scripts and modify headers across all domains |

---

## ⚠️ Disclaimer

This extension is intended for personal convenience. Use it responsibly and in accordance with the terms of service of any websites involved.