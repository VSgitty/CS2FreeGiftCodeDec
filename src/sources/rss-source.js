import Parser from "rss-parser";

const parser = new Parser({
  requestOptions: {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  }
});

export async function scrapeRss(source) {
  const feed = await parser.parseURL(source.url);
  const items = feed.items || [];

  return items.slice(0, 30).map((item) => ({
    title: item.title || "RSS Item",
    text: item.contentSnippet || item.content || "",
    url: item.link || source.url,
    publishedAt: item.isoDate || item.pubDate || null
  }));
}
