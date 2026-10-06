# Pak Hotspot 🇵🇰

A daily editorial digest of **Pakistan headlines** + **global Tech/AI news** — one page, no noise.

**Live:** https://iamcipherdev.github.io/pak-hotspot/

## How it works

- `index.html` — static single page, fetches `data/news.json` and renders a hero top story + two sections (Tech/AI, Pakistan) with source links and "updated X ago".
- `data/news.json` — the daily data file. Schema:
  ```json
  {
    "updated_at": "2026-10-06T11:05:00+05:00",
    "tech":     [{ "title": "...", "summary": "...", "url": "https://...", "source": "Dawn" }],
    "pakistan": [{ "title": "...", "summary": "...", "url": "https://...", "source": "Reuters" }]
  }
  ```
- `scripts/update.mjs` — validates a stories JSON file and writes `data/news.json` with a fresh Karachi timestamp.

## Daily update (cron)

The morning cron does this:

```bash
# 1. Agent compiles verified stories into /tmp/stories.json (real outlets only, no invented links)
# 2. Validate + stamp:
node scripts/update.mjs /tmp/stories.json
# 3. Publish:
git add data/news.json
git commit -m "digest: $(date +%F)"
git push origin main
```

GitHub Pages serves the static site, so the new JSON goes live within a minute — no rebuild needed.

## Local preview

```bash
cd pak-hotspot
python3 -m http.server 8000
# open http://localhost:8000
```

(No build step. `file://` also works except `fetch` needs http(s) — use the command above.)
