export const SERVER_PORT = process.env.PORT ? Number(process.env.PORT) : 4177;
export const SCAN_CRON = process.env.SCAN_CRON || "*/30 * * * *"; // alle 30 Minuten
export const REQUEST_TIMEOUT_MS = 25000;
export const MAX_DISCOVERED_PROVIDERS = 20;
export const MAX_PROVIDERS_SCANNED_PER_RUN = 10;

export const SOURCES = [
  // Instagram-Quellen
  {
    id: "instagram_csgoskins_official",
    type: "instagram_profile",
    name: "Instagram: csgoskins_official",
    url: "https://www.instagram.com/csgoskins_official/"
  },
  {
    id: "instagram_csgocasescom",
    type: "instagram_profile",
    name: "Instagram: csgocasescom",
    url: "https://www.instagram.com/csgocasescom/"
  },
  // Facebook-Quellen
  {
    id: "facebook_csgoskinscom",
    type: "facebook_page",
    name: "Facebook: csgoskinscom",
    url: "https://www.facebook.com/csgoskinscom"
  },
  {
    id: "facebook_csgocasescom",
    type: "facebook_page",
    name: "Facebook: csgocasescom",
    url: "https://www.facebook.com/csgocasescom/"
  },
  // Twitter/X-Quellen
  {
    id: "x_csgocasescom",
    type: "x_profile",
    name: "Twitter/X: csgocasescom",
    url: "https://x.com/csgocasescom"
  },
  // Web-Suchen
  {
    id: "duckduckgo_free_skin_codes",
    type: "web_search",
    name: "Websuche: free skin codes",
    queries: [
      "csgo free code skins",
      "cs2 free code skins",
      "csgo promo code free skin",
      "case opening free code skin"
    ]
  },
  {
    id: "duckduckgo_provider_discovery",
    type: "web_search",
    name: "Websuche: Anbieter Discovery",
    queries: [
      "cs2 skin site promo code",
      "csgo skin gambling bonus code",
      "free case opening bonus code cs2",
      "cs2 promo code deposit bonus"
    ]
  },
  // RSS-Quellen
  {
    id: "reddit_globaloffensive_trade",
    type: "rss",
    name: "Reddit RSS: r/GlobalOffensiveTrade",
    url: "https://www.reddit.com/r/GlobalOffensiveTrade/.rss"
  }
];

export const KEYWORDS = [
  "free code",
  "promo code",
  "skin",
  "bonus code",
  "giveaway",
  "free case",
  "cs2",
  "csgo"
];
