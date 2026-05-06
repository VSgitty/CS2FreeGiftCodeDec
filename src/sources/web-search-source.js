import * as cheerio from "cheerio";
import { compactText } from "../utils/text.js";

function resolveSearchResultUrl(rawUrl) {
  if (!rawUrl) {
    return "";
  }

  const withScheme = rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;

  try {
    const u = new URL(withScheme);

    const isBingRedirect = u.hostname.includes("bing.com") && u.pathname.startsWith("/ck/a");
    if (isBingRedirect) {
      const encoded = (u.searchParams.get("u") || "").replace(/;$/, "");
      if (encoded) {
        const base = encoded.startsWith("a1") ? encoded.slice(2) : encoded;
        const decoded = Buffer.from(base, "base64").toString("utf8");
        if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
          return decoded;
        }
      }
    }

    const isDdgRedirect = u.hostname.includes("duckduckgo.com") && u.pathname.includes("/y.js");
    if (isDdgRedirect) {
      const u3 = u.searchParams.get("u3");
      const uddg = u.searchParams.get("uddg");
      if (uddg) {
        return decodeURIComponent(uddg);
      }
      if (u3) {
        return decodeURIComponent(u3);
      }
    }

    const redirected = u.searchParams.get("uddg");
    if (redirected) {
      return decodeURIComponent(redirected);
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!res.ok) {
    return "";
  }

  return res.text();
}

function parseDuckDuckGo(html, query) {
  const out = [];
  const $ = cheerio.load(html);

  $(".result").each((_, el) => {
    const title = compactText($(el).find(".result__title").text());
    const text = compactText($(el).find(".result__snippet").text());
    const rawUrl = $(el).find(".result__url").text() || "";
    const href = $(el).find("a.result__a").attr("href") || rawUrl;
    const resolvedUrl = resolveSearchResultUrl(href);

    if (!resolvedUrl) {
      return;
    }

    out.push({
      title: title || `Search Result: ${query}`,
      text,
      url: resolvedUrl,
      publishedAt: null
    });
  });

  return out;
}

function parseBing(html, query) {
  const out = [];
  const $ = cheerio.load(html);

  $("li.b_algo").each((_, el) => {
    const a = $(el).find("h2 a").first();
    const href = a.attr("href") || "";
    const resolvedUrl = resolveSearchResultUrl(href);
    const title = compactText(a.text());
    const text = compactText($(el).find(".b_caption p").first().text());

    if (!resolvedUrl) {
      return;
    }

    out.push({
      title: title || `Search Result: ${query}`,
      text,
      url: resolvedUrl,
      publishedAt: null
    });
  });

  return out;
}

export async function scrapeWebSearch(source) {
  const all = [];

  for (const query of source.queries || []) {
    const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    const bingHtml = await fetchHtml(bingUrl);
    let rows = bingHtml ? parseBing(bingHtml, query) : [];

    if (rows.length === 0) {
      const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const ddgHtml = await fetchHtml(ddgUrl);
      rows = ddgHtml ? parseDuckDuckGo(ddgHtml, query) : [];
    }

    all.push(...rows);
  }

  const unique = new Map();
  for (const item of all) {
    unique.set(item.url, item);
  }

  return [...unique.values()].slice(0, 60);
}
