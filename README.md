# GiftDectector

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
