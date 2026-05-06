import * as cheerio from "cheerio";
import { REQUEST_TIMEOUT_MS } from "../config.js";
import { compactText, toAbsoluteUrl } from "../utils/text.js";

const COMMON_PATHS = ["/", "/promo", "/promotions", "/bonus", "/codes", "/free", "/news"];

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return "";
    }

    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeProviderPage(provider) {
  const rows = [];
  const visited = new Set();

  for (const path of COMMON_PATHS) {
    const pageUrl = toAbsoluteUrl(provider.url, path);
    if (!pageUrl || visited.has(pageUrl)) {
      continue;
    }

    visited.add(pageUrl);
    const html = await fetchHtml(pageUrl);
    if (!html) {
      continue;
    }

    const $ = cheerio.load(html);
    const title = compactText($("title").text() || provider.name);
    const bodyText = compactText($("body").text()).slice(0, 3000);

    rows.push({
      title,
      text: bodyText,
      url: pageUrl,
      publishedAt: null
    });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = compactText($(el).text());
      const url = toAbsoluteUrl(provider.url, href);
      const blob = `${text} ${href}`.toLowerCase();

      if (blob.includes("promo") || blob.includes("code") || blob.includes("bonus") || blob.includes("free")) {
        rows.push({
          title: text || `Link auf ${provider.name}`,
          text: blob,
          url,
          publishedAt: null
        });
      }
    });
  }

  const unique = new Map();
  for (const row of rows) {
    if (!row.url) continue;
    unique.set(row.url, row);
  }

  return [...unique.values()].slice(0, 40);
}
