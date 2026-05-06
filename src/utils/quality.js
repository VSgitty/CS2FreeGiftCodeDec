import { compactText } from "./text.js";

const NOISE_PATTERNS = [
  /document\./gi,
  /window\./gi,
  /addEventListener/gi,
  /function\s*\(/gi,
  /=>/g,
  /\{\s*\}/g,
  /cookie/gi,
  /privacy policy/gi,
  /javascript/gi
];

const SIGNAL_WORDS = [
  "promo code",
  "free code",
  "bonus",
  "giveaway",
  "free skins",
  "free case",
  "deposit bonus",
  "code"
];

const SEARCH_BLOCKED_HOSTS = new Set([
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "www.duckduckgo.com",
  "baidu.com",
  "www.baidu.com",
  "zhihu.com",
  "www.zhihu.com"
]);

export function cleanSnippet(input) {
  let text = compactText(input || "");

  // Entfernt ubliche Script-/Cookie-Mullzeichenfolgen in gescrapten Body-Texten.
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, " ");
  }

  text = compactText(text);
  if (!text) {
    return "";
  }

  const tokens = text.split(" ").filter((part) => part.length <= 36);
  return compactText(tokens.join(" "));
}

export function countSignals(text) {
  const lower = (text || "").toLowerCase();
  return SIGNAL_WORDS.reduce((count, word) => count + (lower.includes(word) ? 1 : 0), 0);
}

export function isNoisyText(text) {
  if (!text) {
    return true;
  }

  const cleaned = cleanSnippet(text);
  if (cleaned.length < 20) {
    return true;
  }

  const symbols = (cleaned.match(/[{};<>]/g) || []).length;
  const symbolRate = symbols / Math.max(cleaned.length, 1);
  return symbolRate > 0.03;
}

export function getHostFromUrl(input) {
  try {
    return new URL(input).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isBlockedSearchHost(input) {
  const host = getHostFromUrl(input);
  if (!host) {
    return true;
  }

  if (SEARCH_BLOCKED_HOSTS.has(host)) {
    return true;
  }

  return false;
}

export function looksLikeSkinCodeContent(text) {
  const lower = (text || "").toLowerCase();
  const core = ["cs2", "csgo", "skin", "promo", "code", "bonus", "giveaway", "case"];
  const hits = core.reduce((n, word) => n + (lower.includes(word) ? 1 : 0), 0);
  return hits >= 2;
}
