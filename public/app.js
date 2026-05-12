const itemTpl = document.querySelector("#itemTpl");
const itemsEl = document.querySelector("#items");
const noItemsEl = document.querySelector("#noItems");
const statsEl = document.querySelector("#stats");
const searchEl = document.querySelector("#search");
const onlyCodesEl = document.querySelector("#onlyCodes");
const scanBtn = document.querySelector("#scanBtn");
const sourceFilterEls = document.querySelectorAll(".source-filter");

let allItems = [];
let activeSourceFilters = new Set(["instagram", "facebook", "twitter"]);

function getSourceType(sourceName) {
  const lower = sourceName.toLowerCase();
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("facebook")) return "facebook";
  if (lower.includes("x.com") || lower.includes("twitter")) return "twitter";
  if (lower.includes("reddit")) return "rss";
  return "web";
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "gerade eben";
  if (diffMins < 60) return `vor ${diffMins}m`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays < 7) return `vor ${diffDays}d`;
  
  return d.toLocaleString("de-DE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderStats(scans, totalVisible, totalAll) {
  const last = scans?.[0];
  let errorText = "-";
  if (last && last.errors && last.errors.length > 0) {
    errorText = `${last.errors.length} (${last.errors.map(e => e.source).join(", ")})`;
  }
  
  const rows = [
    `<strong>${totalVisible}</strong> angezeigt`,
    `<strong>${totalAll}</strong> insgesamt`,
    `Zuletzt gescannt: <strong>${last ? formatDate(last.finishedAt) : "-"}</strong>`,
    `Neu: <strong>${last ? last.inserted : 0}</strong>`,
    `Fehler: <strong>${errorText}</strong>`
  ];

  statsEl.innerHTML = rows.map((r) => `<div class="stat">${r}</div>`).join("");
}

function card(item) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  const sourceType = getSourceType(item.sourceName);
  
  const sourceBadge = node.querySelector(".source-badge");
  sourceBadge.textContent = item.sourceName;
  sourceBadge.setAttribute("data-source", sourceType);
  
  node.querySelector(".date").textContent = formatDate(item.publishedAt || item.firstSeenAt);
  node.querySelector(".title").textContent = item.title || "(ohne Titel)";
  node.querySelector(".text").textContent = item.text || "";
  
  const codes = node.querySelector(".codes");

  if ((item.detectedCodes || []).length === 0) {
    codes.innerHTML = "<span class='code no-code'>kein code erkannt</span>";
  } else {
    codes.innerHTML = item.detectedCodes
      .map((code) => `<span class='code' title="Zum Kopieren klicken">${code}</span>`)
      .join("");
    
    // Copy-on-click functionality
    codes.querySelectorAll(".code").forEach(codeEl => {
      codeEl.addEventListener("click", async (e) => {
        e.stopPropagation();
        const text = codeEl.textContent;
        try {
          await navigator.clipboard.writeText(text);
          const originalText = codeEl.textContent;
          codeEl.textContent = "✓ Kopiert!";
          setTimeout(() => {
            codeEl.textContent = originalText;
          }, 1500);
        } catch (err) {
          console.error("Copy failed:", err);
        }
      });
    });
  }

  const a = node.querySelector(".link");
  a.href = item.url;
  a.textContent = `Zum ${sourceType === "instagram" ? "Insta" : sourceType === "facebook" ? "FB" : sourceType === "twitter" ? "X" : "Post"} →`;
  
  return node;
}

function applyFilter() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const onlyCodes = onlyCodesEl.checked;

  const filtered = allItems.filter((item) => {
    // Source filter
    const sourceType = getSourceType(item.sourceName);
    if (!activeSourceFilters.has(sourceType)) {
      return false;
    }

    // Codes filter
    if (onlyCodes && (!item.detectedCodes || item.detectedCodes.length === 0)) {
      return false;
    }

    // Search filter
    if (!q) {
      return true;
    }

    const blob = `${item.sourceName} ${item.title} ${item.text} ${(item.detectedCodes || []).join(" ")}`.toLowerCase();
    return blob.includes(q);
  });

  itemsEl.innerHTML = "";
  noItemsEl.style.display = filtered.length === 0 ? "block" : "none";
  
  for (const item of filtered) {
    itemsEl.appendChild(card(item));
  }

  return filtered.length;
}

async function loadItems() {
  const only = onlyCodesEl.checked;
  const res = await fetch(`/api/items?onlyWithCodes=${only}`);
  const data = await res.json();
  allItems = data.items || [];
  const visible = applyFilter();
  renderStats(data.scans || [], visible, allItems.length);
}

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanne...";

  try {
    const res = await fetch("/api/scan", { method: "POST" });
    if (!res.ok) throw new Error("Scan fehlgeschlagen");
    await loadItems();
  } catch (err) {
    console.error("Scan error:", err);
    alert("Fehler beim Scannen: " + err.message);
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Jetzt neu scannen";
  }
});

searchEl.addEventListener("input", () => {
  applyFilter();
  updateStats();
});

onlyCodesEl.addEventListener("change", loadItems);

sourceFilterEls.forEach(filterEl => {
  filterEl.addEventListener("change", (e) => {
    const source = e.target.dataset.source;
    if (e.target.checked) {
      activeSourceFilters.add(source);
    } else {
      activeSourceFilters.delete(source);
    }
    applyFilter();
    updateStats();
  });
});

function updateStats() {
  const visible = document.querySelectorAll(".card").length;
  const stat = document.querySelector(".stat");
  if (stat) {
    stat.innerHTML = `<strong>${visible}</strong> angezeigt`;
  }
}

// Initial load
loadItems();
