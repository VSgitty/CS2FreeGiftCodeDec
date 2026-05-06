import { promises as fs } from "node:fs";
import crypto from "node:crypto";

const DB_FILE = new URL("../data/cache.json", import.meta.url);

const EMPTY_DB = {
  items: [],
  scans: []
};

export async function loadDb() {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

export async function saveDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export function fingerprint(item) {
  const input = `${item.sourceId}|${item.url}|${(item.detectedCodes || []).join(",")}`;
  return crypto.createHash("sha1").update(input).digest("hex");
}

export async function upsertItems(nextItems) {
  const db = await loadDb();
  const map = new Map(db.items.map((i) => [i.id, i]));
  let inserted = 0;

  for (const item of nextItems) {
    const id = item.id;
    if (!map.has(id)) {
      map.set(id, item);
      inserted += 1;
    } else {
      const prev = map.get(id);
      map.set(id, {
        ...prev,
        ...item,
        firstSeenAt: prev.firstSeenAt || item.firstSeenAt
      });
    }
  }

  db.items = [...map.values()].sort((a, b) => {
    const da = new Date(a.publishedAt || a.firstSeenAt).getTime();
    const dbv = new Date(b.publishedAt || b.firstSeenAt).getTime();
    return dbv - da;
  });

  await saveDb(db);
  return { inserted, total: db.items.length };
}

export async function addScanLog(entry) {
  const db = await loadDb();
  db.scans.unshift(entry);
  db.scans = db.scans.slice(0, 100);
  await saveDb(db);
}
