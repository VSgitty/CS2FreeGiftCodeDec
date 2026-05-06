const itemTpl = document.querySelector("#itemTpl");
const itemsEl = document.querySelector("#items");
const statsEl = document.querySelector("#stats");
const searchEl = document.querySelector("#search");
const onlyCodesEl = document.querySelector("#onlyCodes");
const scanBtn = document.querySelector("#scanBtn");

let allItems = [];

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("de-DE");
}

function renderStats(scans, totalVisible) {
  const last = scans?.[0];
  const rows = [
    `Angezeigt: <strong>${totalVisible}</strong>`,
    `Letzter Scan: <strong>${last ? formatDate(last.finishedAt) : "-"}</strong>`,
    `Neu im letzten Scan: <strong>${last ? last.inserted : 0}</strong>`,
    `Fehler: <strong>${last ? last.errors.length : 0}</strong>`
  ];

  statsEl.innerHTML = rows.map((r) => `<div class="stat">${r}</div>`).join("");
}

function card(item) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".source").textContent = item.sourceName;
  node.querySelector(".date").textContent = formatDate(item.publishedAt || item.firstSeenAt);
  node.querySelector(".title").textContent = item.title || "(ohne Titel)";
  node.querySelector(".text").textContent = item.text || "";
  const codes = node.querySelector(".codes");

  if ((item.detectedCodes || []).length === 0) {
    codes.innerHTML = "<span class='code'>kein code erkannt</span>";
  } else {
    codes.innerHTML = item.detectedCodes
      .map((code) => `<span class='code'>${code}</span>`)
      .join("");
  }

  const a = node.querySelector(".link");
  a.href = item.url;
  return node;
}

function applyFilter() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const onlyCodes = onlyCodesEl.checked;

  const filtered = allItems.filter((item) => {
    if (onlyCodes && (!item.detectedCodes || item.detectedCodes.length === 0)) {
      return false;
    }

    if (!q) {
      return true;
    }

    const blob = `${item.sourceName} ${item.title} ${item.text} ${(item.detectedCodes || []).join(" ")}`.toLowerCase();
    return blob.includes(q);
  });

  itemsEl.innerHTML = "";
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
  renderStats(data.scans || [], visible);
}

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanne...";

  try {
    await fetch("/api/scan", { method: "POST" });
    await loadItems();
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Jetzt neu scannen";
  }
});

searchEl.addEventListener("input", () => {
  const visible = applyFilter();
  const stat = document.querySelector(".stat");
  if (stat) {
    stat.innerHTML = `Angezeigt: <strong>${visible}</strong>`;
  }
});

onlyCodesEl.addEventListener("change", loadItems);

loadItems();
