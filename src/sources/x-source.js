import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { REQUEST_TIMEOUT_MS } from "../config.js";
import { compactText, toAbsoluteUrl } from "../utils/text.js";

export async function scrapeTwitterProfile(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS
    });

    // Twitter braucht mehr Zeit zum Laden
    await page.waitForTimeout(3000);

    const html = await page.content();
    const $ = cheerio.load(html);
    const items = [];

    // Extrahiere Tweets mit Links zu Einzeltweets
    $("a[href*='/status/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      
      if (href.includes("/status/")) {
        const tweetUrl = toAbsoluteUrl("https://x.com", href);
        
        // Versuche, den Tweet-Text zu extrahieren
        const article = $(el).closest("article");
        const text = article.length ? compactText(article.text()) : compactText($(el).text());
        const title = text ? text.slice(0, 160) : "X Post";

        items.push({
          title,
          text,
          url: tweetUrl,
          publishedAt: null
        });
      }
    });

    // Deduplizieren
    const unique = new Map();
    for (const item of items) {
      unique.set(item.url, item);
    }

    return [...unique.values()].slice(0, 30);
  } catch (err) {
    console.error("Error scraping X:", err.message);
    return [];
  } finally {
    await page.close();
    await browser.close();
  }
}
