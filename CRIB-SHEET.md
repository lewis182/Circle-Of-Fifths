# Deployment Crib Sheet

**App:** Circle of Fifths + Score Analyser
**Target:** GitHub Pages (free static hosting)
**Time required:** ~5 minutes

---

## What's in this zip

```
index.html              # Main app — opens at the root URL
score-analyser.html     # Score Analyser sub-page
ai-features.jsx         # Shared AI logic (loaded by both HTML files)
manifest.json           # PWA install metadata
sw.js                   # Service worker — offline support after first visit
icon.svg                # Vector app icon
icon-180.png            # Apple touch icon (iPad home screen)
icon-192.png            # PWA icon
icon-512.png            # PWA icon (large)
CRIB-SHEET.md           # This file
```

That's the complete app. No build step, no dependencies to install.

---

## 1. Push to GitHub

Open Terminal in the unzipped folder, then:

```bash
git init
git add .
git commit -m "Circle of Fifths app v2"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Replace `<your-username>` and `<repo-name>` with your GitHub values.

If the repo already exists with content you want to overwrite, add `--force` to the push:
```bash
git push -u origin main --force
```

---

## 2. Enable GitHub Pages

1. On github.com, open your repo
2. **Settings** (top tab) → **Pages** (left sidebar)
3. Under **Source**, choose: `Deploy from a branch`
4. Branch: `main` · Folder: `/ (root)` → **Save**
5. Wait ~60 seconds. The page will show the live URL — something like:
   `https://<your-username>.github.io/<repo-name>/`

That URL is your app. Bookmark it.

---

## 3. Install on iPad

1. Open the URL in **Safari** (must be Safari, not Chrome — iOS won't install from other browsers)
2. Tap the **Share** button (square with up arrow)
3. Scroll down → **Add to Home Screen**
4. Confirm

You now have a standalone icon. Tapping it launches the app full-screen, no Safari chrome.

**Offline support:** First time you launch via Wi-Fi, the service worker caches everything. After that, the app loads and runs offline — the only thing that needs internet is AI calls (Score Analyser uploads, Daily Challenge, Quiz, Song Decoder, AI tab).

---

## 4. Set your API key

1. Open the app
2. Tap the **🔑** button in the floating toolbar at the bottom
3. Choose provider:
   - **Anthropic** — direct Claude API. Get a key at console.anthropic.com (starts `sk-ant-`)
   - **OpenRouter** — access to Claude / GPT / Gemini / open models. Get a key at openrouter.ai/keys (starts `sk-or-`)
4. Pick a model (Claude Haiku 4.5 is the cheapest recommended default)
5. Tap **Test** to verify, then **Save**

The same key works for both the main app's AI features and the Score Analyser — stored locally in your browser only.

---

## 5. Updating later

When you want to push a change:

```bash
# Edit any file
git add .
git commit -m "What changed"
git push
```

GitHub Pages will redeploy in ~30 seconds. To force the PWA on your iPad to pick up the new version:

1. Close the installed app entirely (swipe up from app switcher)
2. Re-open it
3. The service worker bumps version and pulls fresh files

If the PWA seems "stuck" on an old version, delete from the home screen and re-add — quickest fix.

---

## Where things live (for future edits)

| Change | File |
|---|---|
| Add a new tab to a key page | `index.html` — search `MAJOR_TABS` / `MINOR_TABS` |
| Add a new chord progression | `index.html` — search `MAJOR_PROGRESSIONS` / `MINOR_PROGRESSIONS` |
| Quiz questions level / topics | `ai-features.jsx` — search `TOPICS` (in `QuizModal`) |
| Score Analyser visual styling | `score-analyser.html` — all CSS in `<style>` at the top |
| PDF lyric-stripping rules | `score-analyser.html` — search `preprocessChordText` |
| Add a model option | `ai-features.jsx` — search `PROVIDERS` |
| Accent colour, default fonts | `index.html` — search `--accent` and `TWEAK_DEFAULTS` |

---

## Known limits

- **PDFs cost more than MusicXML** to analyse. Prefer MusicXML where your notation app supports it.
- **Scanned PDFs** trigger the AI vision path — much more expensive. Use real (text-based) PDFs where possible.
- **AI calls require internet.** The rest of the app works offline.
- **No audio playback.** Tap-to-hear was on the wishlist but not built.

---

## Troubleshooting

**Pages says "Site is not published":** wait another minute and refresh — first deploy can take a few minutes.

**Blank page:** open browser dev tools (F12 / Inspect) and check the Console tab. Most likely cause: the file paths in the URL are case-sensitive on GitHub Pages but were case-insensitive on macOS. Make sure your file names match exactly: `index.html`, `score-analyser.html`, etc. (lowercase, no spaces).

**Score Analyser back button doesn't return to the wheel:** the back button is hard-coded to navigate to `index.html`. If you renamed the main file, edit the `back-btn` button's `onclick` in `score-analyser.html`.

**iPad PWA looks old after update:** see "Updating later" above.

**AI calls fail with "401":** API key is invalid or expired — re-enter in the 🔑 settings.

**AI calls fail with "402":** out of credits on your provider. Top up at console.anthropic.com or openrouter.ai.

---

That's it. Push, wait a minute, bookmark the URL, add to home screen.
