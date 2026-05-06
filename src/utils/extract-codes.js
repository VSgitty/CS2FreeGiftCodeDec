const CODE_PATTERNS = [
  /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{3,})+\b/g, // z.B. FREE-SKIN-2026
  /(?:code|promo|bonus)\s*[:\-]\s*([A-Z0-9_\-]{4,})/gi,
  /\b(?:FREE|SKIN|CS2|CSGO)[A-Z0-9_\-]{2,}\b/gi
];

export function extractCodes(text) {
  if (!text) {
    return [];
  }

  const matches = new Set();

  for (const pattern of CODE_PATTERNS) {
    const found = [...text.matchAll(pattern)];
    for (const m of found) {
      const value = (m[1] || m[0] || "").trim();
      if (value.length >= 4 && value.length <= 40) {
        matches.add(value.toUpperCase());
      }
    }
  }

  return [...matches];
}
