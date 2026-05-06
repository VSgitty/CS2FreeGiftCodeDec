import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { REQUEST_TIMEOUT_MS } from "../config.js";
import { compactText, toAbsoluteUrl } from "../utils/text.js";

export async function scrapeFacebookPage(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS
    });

    await page.waitForTimeout(2000);

    const html = await page.content();
    const $ = cheerio.load(html);
    const items = [];

    $("a[href*='/posts/'], a[href*='/videos/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const postUrl = toAbsoluteUrl(source.url, href);
      const raw = compactText($(el).text());
      const title = raw ? raw.slice(0, 120) : "Facebook Post";

      items.push({
        title,
        text: raw,
        url: postUrl,
        publishedAt: null
      });
    });

    const unique = new Map();
    for (const item of items) {
      if (item.url.includes("/posts/") || item.url.includes("/videos/")) {
        unique.set(item.url, item);
      }
    }

    return [...unique.values()].slice(0, 20);
  } finally {
    await page.close();
    await browser.close();
  }
}
