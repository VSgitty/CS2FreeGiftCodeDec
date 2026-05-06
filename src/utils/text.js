export function compactText(input) {
  return (input || "").replace(/\s+/g, " ").trim();
}

export function hasKeyword(text, keywords) {
  const lower = (text || "").toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function toAbsoluteUrl(base, maybeRelative) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative || "";
  }
}
