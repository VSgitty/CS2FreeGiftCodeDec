const CODE_PATTERNS = [
  // "FREE CODE: ABC123" oder "code: ABC123"
  /(?:free\s+)?code\s*[:\-\s]+([A-Z0-9_\-]{4,})/gi,
  // "Promo Code ABC123"
  /promo\s+code\s*[:\-\s]+([A-Z0-9_\-]{4,})/gi,
  // "Use: ABC123DEF456"
  /use\s*[:\-\s]+([A-Z0-9_\-]{4,})/gi,
  // Standalone Codes: FREESKINS, ABC-123-DEF, etc.
  /\b[A-Z0-9]{4,}(?:-[A-Z0-9]{2,})+\b/g,
  // Bonus Code Pattern
  /bonus\s+code\s*[:\-\s]+([A-Z0-9_\-]{4,})/gi,
  // CS2-SKINS, FREE-CASE, etc.
  /\b(?:FREE|SKIN|CS2|CSGO|BONUS)[A-Z0-9_\-]{2,}\b/gi
];

export function extractCodes(text) {
  if (!text) {
    return [];
  }

  const matches = new Set();

  for (const pattern of CODE_PATTERNS) {
    const found = [...text.matchAll(pattern)];
    for (const m of found) {
      // Nimm captured group (1) oder ganzen match (0)
      const value = (m[1] || m[0] || "").trim();
      if (value.length >= 4 && value.length <= 40) {
        matches.add(value.toUpperCase());
      }
    }
  }

  return [...matches];
}
