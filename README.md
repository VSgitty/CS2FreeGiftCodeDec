# GiftDectector - Free Code Monitor für CS Skins

Ein Scraper-Dashboard, das automatisch "Free Code" Posts von Instagram, Facebook, Twitter/X und weiteren Quellen sammelt und übersichtlich darstellt.

## Features

- 🔄 **Automatisches Scraping** - Alle 30 Minuten neue Posts fetchen
- 📱 **Multi-Plattform** - Instagram, Facebook, Twitter/X, RSS & Web-Suche
- 🔍 **Code-Erkennung** - Automatische Extraktion von Promo-Codes
- 🎯 **Filter & Suche** - Nach Quelle, Code oder Text filtern
- ⚡ **Echtzeit-Dashboard** - Schnelle, responsive Anzeige
- 🔧 **Erweiterbar** - Einfach neue Quellen hinzufügen

## Installation & Start

```bash
npm install
npm run dev      # Entwicklung mit --watch
npm run start    # Production
npm run scan     # Einmalig scannen
```

Server läuft auf: `http://localhost:4177`

## Architektur

### Dateistruktur

```
src/
├── config.js                 # Quellen-Konfiguration
├── server.js                 # Express API Server
├── scanner.js                # Scraping-Orchester
├── storage.js                # Datenbank (JSON-basiert)
├── provider-registry.js      # Anbieter-Discovery
├── utils/
│   ├── extract-codes.js      # Code-Regex-Logik
│   ├── text.js               # Text-Utilities
│   └── quality.js            # Qualitäts-Checks
└── sources/                  # Quelle-Implementierungen
    ├── instagram-source.js
    ├── facebook-source.js
    ├── x-source.js           # Twitter/X
    ├── rss-source.js
    ├── web-search-source.js
    └── provider-source.js
```

## Neue Quellen hinzufügen

### 1. Neue Quelle definieren in `config.js`

```javascript
export const SOURCES = [
  // ... existierende Quellen ...
  {
    id: "meine_neue_quelle",
    type: "meine_quelle_typ",        // eindeutiger Typ!
    name: "Meine Quelle",
    url: "https://example.com/..."
  }
];
```

### 2. Scraper-Funktion in `src/sources/` erstellen

Beispiel: `src/sources/telegram-source.js`

```javascript
import { REQUEST_TIMEOUT_MS } from "../config.js";

export async function scrapeTelegramChannel(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS
    });

    // Dein Scraping-Logik hier...
    const items = [];

    // Extrahiere Posts/Inhalte und normalize zu diesem Format:
    items.push({
      title: "Titel oder Überschrift",
      text: "Voller Text des Posts",
      url: "https://...",           // Direktlink zum Post
      publishedAt: "2026-05-12T..."  // ISO-String oder null
    });

    return items.slice(0, 30);  // Max 30 Items
  } finally {
    await page.close();
    await browser.close();
  }
}
```

**Wichtig:**
- `text` und `title` werden kombiniert für Code-Erkennung
- `url` muss direkt zum Post führen (für Frontend)
- Return-Array mit max. 30 Items
- Browser-Fehler werfen (Fehlerbehandlung in `scanner.js`)

### 3. Scanner aktualisieren (`src/scanner.js`)

Schritt 1 - Import hinzufügen:
```javascript
import { scrapeTelegramChannel } from "./sources/telegram-source.js";
```

Schritt 2 - Case in `scrapeSource()` hinzufügen:
```javascript
async function scrapeSource(source) {
  switch (source.type) {
    case "meine_quelle_typ":
      return scrapeTelegramChannel(source);
    // ... rest ...
    default:
      return [];
  }
}
```

### 4. Fertig!

Neue Quelle wird beim nächsten Scan automatisch verarbeitet.

## Code-Erkennung anpassen

In `src/utils/extract-codes.js`:

```javascript
const CODE_PATTERNS = [
  /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,})+\b/g,  // z.B. FREE-SKIN-2026
  /(?:code|promo|bonus)\s*[:\-]\s*([A-Z0-9_\-]{4,})/gi,
  /\b(?:FREE|SKIN|CS2|CSGO)[A-Z0-9_\-]{2,}\b/gi,
  // Neue Pattern hier hinzufügen
];
```

## Keywords für Filterung

In `src/config.js` → `KEYWORDS`:

```javascript
export const KEYWORDS = [
  "free code",
  "promo code",
  "bonus code",
  // ... deine Keywords ...
];
```

## API-Endpoints

### `GET /api/items?onlyWithCodes=true|false`
Alle gescrapten Items

```json
{
  "items": [
    {
      "id": "...",
      "sourceName": "Instagram: csgoskins_official",
      "title": "...",
      "text": "...",
      "detectedCodes": ["FREE-SKIN-2026", "BONUS100"],
      "url": "https://instagram.com/p/...",
      "publishedAt": "2026-05-12T10:30:00Z",
      "firstSeenAt": "...",
      "lastSeenAt": "..."
    }
  ],
  "scans": [...]
}
```

### `POST /api/scan`
Manuell einen Scan triggern

### `GET /api/health`
Health-Check

## Performance-Tipps

- **Playlist-Limits**: `MAX_PROVIDERS_SCANNED_PER_RUN`, `MAX_DISCOVERED_PROVIDERS`
- **Scan-Zeitplan**: `SCAN_CRON` in `config.js`
- **Timeout**: `REQUEST_TIMEOUT_MS` pro Quelle
- **Browser**: Playwright headless (schneller als mit UI)

## Umgebungsvariablen

```bash
PORT=4177                    # Server-Port
SCAN_CRON="*/30 * * * *"    # Cron-Intervall
```

## Datenbank

`data/cache.json` - Gecachte Items (SQLite-kompatible Struktur möglich)
`data/providers.json` - Entdeckte Code-Anbieter

## Debugging

```bash
# Einzelnen Scan ausführen (mit Logs)
npm run scan

# Mit Node debugger
node --inspect src/server.js
```

## Lizenz

MIT


Dieses Tool scannt regelmassig Social- und Web-Quellen nach neuen Posts mit moglichen Free Codes fur CS-Skins und zeigt alles in einem Dashboard.

Neu: Das Tool sucht selbststandig nach weiteren Anbietern, speichert diese in einer Registry und scannt diese Anbieter-Seiten automatisch mit.

## Enthaltene Quellen

- Instagram: `https://www.instagram.com/csgoskins_official/`
- Facebook: `https://www.facebook.com/csgoskinscom`
- Websuche (DuckDuckGo) auf relevante Keywords
- Websuche (Bing-first, DuckDuckGo fallback) auf relevante Keywords
- Reddit RSS als Zusatzsignal
- Automatisch gefundene Anbieter aus Suchtreffern (dynamische Registry)

Du kannst weitere Quellen in `src/config.js` einfugen.

## Schnellstart

```bash
cd giftdectector
npm install
npx playwright install chromium
npm run dev
```

Dann offnen: `http://localhost:4177`

## Funktionen

- Automatischer Scan per Cron (`SCAN_CRON`, Standard alle 30 Minuten)
- Manueller Button "Jetzt neu scannen"
- Erkennung moglicher Codes aus Texten (`FREE-SKIN-...`, `CODE: ...` usw.)
- Filter nach "nur mit erkanntem Code"
- Volltextsuche uber Quelle, Titel, Text und Codes
- Anbieter-Discovery mit Speicherung in `data/providers.json`
- Zusatzscan von Anbieter-Seiten wie `/promo`, `/bonus`, `/codes`, `/free`

## Wichtige Hinweise

- Social-Plattformen (vor allem Instagram/Facebook) konnen Scraping technisch oder rechtlich einschranken. Das Tool nutzt nur offentlich verfugbare Seiteninhalte.
- Falls weniger Treffer kommen als erwartet, sind oft Login-Walls, Rate-Limits oder geanderte HTML-Strukturen der Grund.
- Fur hohe Stabilitat sind offizielle APIs oder RSS/Partnerfeeds immer besser als reines HTML-Scraping.

## Konfiguration

Um Quellen zu erweitern, bearbeite `src/config.js`:

- `instagram_profile` mit `url`
- `facebook_page` mit `url`
- `rss` mit `url`
- `web_search` mit `queries: []`

Die automatisch gefundenen Anbieter findest du in `data/providers.json`.

## Einmaliger Scan in der Konsole

```bash
npm run scan
```
