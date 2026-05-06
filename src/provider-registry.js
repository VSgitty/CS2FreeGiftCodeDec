import { promises as fs } from "node:fs";

const PROVIDERS_FILE = new URL("../data/providers.json", import.meta.url);

const BLOCKED_HOSTS = new Set([
  "duckduckgo.com",
  "www.duckduckgo.com",
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "reddit.com",
  "www.reddit.com",
  "youtube.com",
  "www.youtube.com",
  "tiktok.com",
  "www.tiktok.com"
]);

function safeUrl(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function normalizeHost(hostname) {
  if (!hostname) return "";
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function isCandidateHost(host) {
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host) || BLOCKED_HOSTS.has(`www.${host}`)) {
    return false;
  }

  const blockedSuffixes = [".gov", ".edu", ".wikipedia.org"];
  if (blockedSuffixes.some((s) => host.endsWith(s))) {
    return false;
  }

  return true;
}

export async function loadProviders() {
  try {
    const raw = await fs.readFile(PROVIDERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.providers) ? parsed.providers : [];
  } catch {
    return [];
  }
}

async function saveProviders(providers) {
  const payload = {
    updatedAt: new Date().toISOString(),
    providers
  };

  await fs.writeFile(PROVIDERS_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export async function discoverAndStoreProviders(searchRows, options = {}) {
  const maxProviders = options.maxProviders || 20;
  const prev = await loadProviders();
  const map = new Map(prev.map((p) => [p.host, p]));

  for (const row of searchRows) {
    const u = safeUrl(row.url);
    if (!u) continue;
    const host = normalizeHost(u.hostname);
    if (!isCandidateHost(host)) continue;

    const textBlob = `${row.title || ""} ${row.text || ""} ${row.url || ""}`.toLowerCase();
    const score = ["csgo", "cs2", "skin", "code", "promo", "case", "bonus"].reduce(
      (acc, word) => acc + (textBlob.includes(word) ? 1 : 0),
      0
    );

    if (score < 2) {
      continue;
    }

    const existing = map.get(host);
    const now = new Date().toISOString();
    if (!existing) {
      map.set(host, {
        id: `provider_${host.replace(/[^a-z0-9]+/g, "_")}`,
        name: host,
        host,
        url: `https://${host}`,
        score,
        firstSeenAt: now,
        lastSeenAt: now
      });
    } else {
      map.set(host, {
        ...existing,
        score: Math.max(existing.score || 0, score),
        lastSeenAt: now
      });
    }
  }

  const providers = [...map.values()]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, maxProviders);

  await saveProviders(providers);
  return providers;
}
