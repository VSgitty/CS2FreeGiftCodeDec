import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { REQUEST_TIMEOUT_MS } from "../config.js";
import { compactText, toAbsoluteUrl } from "../utils/text.js";

export async function scrapeInstagramProfile(source) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS
    });

    await page.waitForTimeout(2200);

    const html = await page.content();
    const $ = cheerio.load(html);
    const items = [];

    $("a[href*='/p/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const postUrl = toAbsoluteUrl(source.url, href);
      const imgAlt = compactText($(el).find("img").attr("alt") || "");
      const title = imgAlt ? imgAlt.slice(0, 160) : "Instagram Post";

      if (postUrl.includes("/p/")) {
        items.push({
          title,
          text: imgAlt,
          url: postUrl,
          publishedAt: null
        });
      }
    });

    const unique = new Map();
    for (const item of items) {
      unique.set(item.url, item);
    }

    return [...unique.values()].slice(0, 20);
  } finally {
    await page.close();
    await browser.close();
  }
}
