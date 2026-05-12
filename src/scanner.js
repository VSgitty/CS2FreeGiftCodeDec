import {
  KEYWORDS,
  MAX_DISCOVERED_PROVIDERS,
  MAX_PROVIDERS_SCANNED_PER_RUN,
  SOURCES
} from "./config.js";
import { extractCodes } from "./utils/extract-codes.js";
import { compactText, hasKeyword } from "./utils/text.js";
import { scrapeInstagramProfile } from "./sources/instagram-source.js";
import { scrapeFacebookPage } from "./sources/facebook-source.js";
import { scrapeTwitterProfile } from "./sources/x-source.js";
import { scrapeRss } from "./sources/rss-source.js";
import { scrapeWebSearch } from "./sources/web-search-source.js";
import { scrapeProviderPage } from "./sources/provider-source.js";
import { discoverAndStoreProviders } from "./provider-registry.js";
import { addScanLog, fingerprint, upsertItems } from "./storage.js";

async function scrapeSource(source) {
  switch (source.type) {
    case "instagram_profile":
      return scrapeInstagramProfile(source);
    case "facebook_page":
      return scrapeFacebookPage(source);
    case "x_profile":
      return scrapeTwitterProfile(source);
    case "rss":
      return scrapeRss(source);
    case "web_search":
      return scrapeWebSearch(source);
    default:
      return [];
  }
}

function normalizeItem(source, raw) {
  const mergedText = compactText(`${raw.title || ""} ${raw.text || ""}`);
  const detectedCodes = extractCodes(mergedText);
  const keep = detectedCodes.length > 0 || hasKeyword(mergedText, KEYWORDS);

  if (!keep) {
    return null;
  }

  const now = new Date().toISOString();
  const normalized = {
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    title: compactText(raw.title || "(ohne Titel)"),
    text: compactText(raw.text || ""),
    url: raw.url || source.url,
    publishedAt: raw.publishedAt || null,
    detectedCodes,
    firstSeenAt: now,
    lastSeenAt: now,
    scannedAt: now
  };

  normalized.id = fingerprint(normalized);
  return normalized;
}

export async function runScan() {
  const startedAt = new Date().toISOString();
  const collected = [];
  const errors = [];
  const webSearchRows = [];

  for (const source of SOURCES) {
    try {
      const rows = await scrapeSource(source);
      if (source.type === "web_search") {
        webSearchRows.push(...rows);
      }
      const normalized = rows
        .map((r) => normalizeItem(source, r))
        .filter(Boolean);
      collected.push(...normalized);
    } catch (err) {
      errors.push({ source: source.name, message: err.message });
    }
  }

  try {
    const discovered = await discoverAndStoreProviders(webSearchRows, {
      maxProviders: MAX_DISCOVERED_PROVIDERS
    });

    for (const provider of discovered.slice(0, MAX_PROVIDERS_SCANNED_PER_RUN)) {
      try {
        const rows = await scrapeProviderPage(provider);
        const providerSource = {
          id: provider.id,
          type: "provider_page",
          name: `Anbieter: ${provider.name}`,
          url: provider.url
        };

        const normalized = rows
          .map((r) => normalizeItem(providerSource, r))
          .filter(Boolean);
        collected.push(...normalized);
      } catch (err) {
        errors.push({ source: provider.name, message: err.message });
      }
    }
  } catch (err) {
    errors.push({ source: "Provider Discovery", message: err.message });
  }

  const { inserted, total } = await upsertItems(collected);
  const finishedAt = new Date().toISOString();

  const scan = {
    startedAt,
    finishedAt,
    sources: SOURCES.length,
    collected: collected.length,
    inserted,
    total,
    errors
  };

  await addScanLog(scan);
  return scan;
}
