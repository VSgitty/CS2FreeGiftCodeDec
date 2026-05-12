# Neue Quellen hinzufügen - Schritt-für-Schritt

## Übersicht

GiftDectector ist modular aufgebaut und unterstützt folgende Quelltypen:
- `instagram_profile` - Instagram Profile
- `facebook_page` - Facebook Seiten
- `x_profile` - Twitter/X Profile
- `rss` - RSS-Feeds
- `web_search` - Web-Suche (DuckDuckGo)
- `provider_page` - Beliebige Websites

## Beispiel 1: LinkedIn-Profil scrapen

### Schritt 1: Source in `config.js` hinzufügen

```javascript
{
  id: "linkedin_csgo_deals",
  type: "linkedin_company",
  name: "LinkedIn: CSGO Skin Company",
  url: "https://www.linkedin.com/company/csgo-skins/"
}
```

### Schritt 2: `src/sources/linkedin-source.js` erstellen

```javascript
import { chromium } from "playwright";
import { REQUEST_TIMEOUT_MS } from "../config.js";
import { compactText } from "../utils/text.js";

export async function scrapeLinkedInCompany(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS
    });

    await page.waitForTimeout(2500);

    const html = await page.content();
    // Nutze Cheerio zum Parsen
    const $ = cheerio.load(html);
    const items = [];

    // Suche nach Posts mit Free-Code Keywords
    $("div[data-test-id*='post']").each((_, el) => {
      const text = compactText($(el).text());
      const url = $(el).find("a[href*='/feed/update']").attr("href");

      if (text && url) {
        items.push({
          title: text.slice(0, 120),
          text: text,
          url: `https://www.linkedin.com${url}`,
          publishedAt: null
        });
      }
    });

    return items.slice(0, 20);
  } finally {
    await page.close();
    await browser.close();
  }
}
```

### Schritt 3: Import & Case in `scanner.js` hinzufügen

```javascript
import { scrapeLinkedInCompany } from "./sources/linkedin-source.js";

// In scrapeSource():
case "linkedin_company":
  return scrapeLinkedInCompany(source);
```

**Fertig!** Die App scraped jetzt LinkedIn-Posts.

---

## Beispiel 2: Telegram-Kanal

```javascript
// config.js
{
  id: "telegram_csgo_codes",
  type: "telegram_channel",
  name: "Telegram: CSGO Codes Channel",
  url: "https://t.me/csgo_free_codes"
}
```

```javascript
// src/sources/telegram-source.js
export async function scrapeTelegramChannel(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "networkidle",
      timeout: REQUEST_TIMEOUT_MS
    });

    // Telegram lädt dynamisch - scrolle nach unten
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 5);
    });
    await page.waitForTimeout(2000);

    const messages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".bubble")).map(el => ({
        text: el.textContent,
        url: window.location.href
      }));
    });

    return messages
      .filter(m => m.text.length > 10)
      .slice(0, 25);
  } finally {
    await page.close();
    await browser.close();
  }
}
```

---

## Beispiel 3: Discord-Server (über Web-Archiv)

Manche Services bieten Web-Ansichten für Discord-Server:

```javascript
// config.js
{
  id: "discord_csgo_deals",
  type: "discord_channel",
  name: "Discord: CSGO Deals (via Disboard)",
  url: "https://disboard.org/server/123456789"
}
```

---

## Wichtige Utilities

### Text-Verarbeitung

```javascript
import { compactText, toAbsoluteUrl, hasKeyword } from "../utils/text.js";

// compactText(str) - Normalisiert Whitespace
const clean = compactText("  Hello   \n\n  World  ");
// Result: "Hello World"

// toAbsoluteUrl(baseUrl, href)
const full = toAbsoluteUrl("https://instagram.com/user/", "../other");
// Result: "https://instagram.com/other"

// hasKeyword(text, keywords)
if (hasKeyword(text, ["free code", "promo"])) { ... }
```

### Code-Extraktion debuggen

```javascript
import { extractCodes } from "../utils/extract-codes.js";

const text = "Use code FREE-SKIN-2026 for 50% off!";
const codes = extractCodes(text);
console.log(codes); // ["FREE-SKIN-2026"]
```

---

## Best Practices

### ✅ DO

```javascript
// 1. Immer Fehlerbehandlung
try {
  // scraping logic
} catch (err) {
  console.error("Scrape failed:", err.message);
  return [];
}

// 2. Browser schließen
finally {
  await page.close();
  await browser.close();
}

// 3. Max Items limitieren
return items.slice(0, 30);

// 4. URLs normalisieren
url: toAbsoluteUrl(source.url, href)

// 5. Return-Format konsistent
{
  title: string,
  text: string,
  url: string,
  publishedAt: ISO-String | null
}
```

### ❌ DON'T

```javascript
// 1. Browser nicht schließen (Memory-Leak)
// ❌ FALSCH:
return items; // Browser bleibt offen!

// 2. Zu viele Items
// ❌ FALSCH:
return items; // kann 1000+ sein

// ✅ RICHTIG:
return items.slice(0, 25);

// 3. Timeout ignoren
// ❌ FALSCH:
await page.goto(url); // kann hängen bleiben

// ✅ RICHTIG:
await page.goto(url, { timeout: REQUEST_TIMEOUT_MS });
```

---

## Debugging & Testing

### Source einzeln testen

```bash
# Erstelle src/test-source.js
import { scrapeLinkedInCompany } from "./sources/linkedin-source.js";

const source = {
  id: "test",
  type: "linkedin_company",
  name: "Test",
  url: "https://www.linkedin.com/company/csgo-skins/"
};

const items = await scrapeLinkedInCompany(source);
console.log("Found items:", items.length);
items.forEach(item => console.log(item));
```

```bash
node src/test-source.js
```

### Fehlerhafte URLs debuggen

```javascript
// In deiner Source-Datei:
console.log("Scraped:", {
  totalItems: items.length,
  urls: items.map(i => i.url),
  hasText: items.map(i => i.text ? "yes" : "no")
});
```

---

## Performance

### Timeout anpassen

Für langsame Seiten:
```javascript
// In deiner Source
const CUSTOM_TIMEOUT = 45000; // 45s statt default 25s
await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: CUSTOM_TIMEOUT
});
```

### Caching

Scraped Items werden dedupliziert via `fingerprint()`. Wiederholte Posts verschwinden nicht, sondern werden aktualisiert.

---

## Häufige Fehler

| Fehler | Grund | Lösung |
|--------|-------|--------|
| "Browser timeout" | Seite lädt zu langsam | `waitForTimeout()` erhöhen |
| "No items found" | Selektoren falsch | Browser-Dev-Tools nutzen |
| "Memory leak" | Browser nicht geschlossen | `finally { browser.close() }` |
| "Duplicate items" | URLs nicht normalisiert | `toAbsoluteUrl()` nutzen |
| "Codes nicht erkannt" | Regex zu restriktiv | Pattern in `extract-codes.js` erweitern |

---

Fragen? Schau in `src/sources/instagram-source.js` als Reference!
