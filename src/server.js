import express from "express";
import cron from "node-cron";
import { SERVER_PORT, SCAN_CRON } from "./config.js";
import { loadDb } from "./storage.js";
import { runScan } from "./scanner.js";

const app = express();
app.use(express.json());
app.use(express.static(new URL("../public", import.meta.url).pathname));

app.get("/api/items", async (req, res) => {
  const db = await loadDb();
  const onlyWithCodes = String(req.query.onlyWithCodes || "false") === "true";

  const items = db.items.filter((item) => {
    if (onlyWithCodes && (!item.detectedCodes || item.detectedCodes.length === 0)) {
      return false;
    }
    return true;
  });

  res.json({
    items,
    total: items.length,
    scans: db.scans.slice(0, 10)
  });
});

app.post("/api/scan", async (_req, res) => {
  const result = await runScan();
  res.json(result);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

cron.schedule(SCAN_CRON, async () => {
  try {
    await runScan();
  } catch (err) {
    console.error("Scan failed:", err.message);
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`GiftDectector läuft auf http://localhost:${SERVER_PORT}`);
});

// Startet den ersten Scan nach dem Serverstart im Hintergrund.
setTimeout(async () => {
  try {
    await runScan();
  } catch (err) {
    console.error("Initial scan failed:", err.message);
  }
}, 0);
