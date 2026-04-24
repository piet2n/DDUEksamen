const toggle = document.getElementById("autoDenyToggle");
const scoreEl = document.getElementById("score");
const statusText = document.getElementById("statusText");
const trackerCountEl = document.getElementById("trackerCount");
const trackerListEl = document.getElementById("trackerList");

// Toggle
chrome.storage.local.get(["autoDeny"], (result) => {
  toggle.checked = result.autoDeny || false;
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoDeny: toggle.checked });
});

// Format
function formatTracker(domain) {
  if (domain.includes("google")) return "Google";
  if (domain.includes("facebook")) return "Facebook";
  if (domain.includes("tiktok")) return "TikTok";
  if (domain.includes("doubleclick")) return "Google Ads";
  return domain;
}

// Score
function calculateScore(count) {
  return Math.max(0, 100 - count * 10);
}

function getStatus(score) {
  if (score > 80) return { text: "Safe", class: "safe" };
  if (score > 50) return { text: "Some tracking", class: "warn" };
  return { text: "Heavy tracking", class: "danger" };
}

// Load data
function loadData() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.storage.local.get([`trackers_${tabId}`], (result) => {
      const trackers = result[`trackers_${tabId}`] || [];
      const count = trackers.length;

      trackerCountEl.innerHTML = `<strong>${count}</strong>`;

      const score = calculateScore(count);
      scoreEl.innerText = score;

      const status = getStatus(score);
      statusText.innerText = status.text;
      scoreEl.className = `score ${status.class}`;

      if (count > 0) {
        trackerListEl.innerHTML =
          "<ul>" +
          [...new Set(trackers.map(formatTracker))]
            .map(t => `<li>${t}</li>`)
            .join("") +
          "</ul>";
      } else {
        trackerListEl.innerText = "No trackers detected";
      }
    });
  });
}

// GRAPH
function drawGraph(stats) {
  const canvas = document.getElementById("statsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const data = [
    stats.todayBlocked || 0,
    Math.floor((stats.totalBlocked || 0) / 7),
    stats.totalBlocked || 0
  ];

  const max = Math.max(...data, 10);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  data.forEach((val, i) => {
    const height = (val / max) * 100;
    ctx.fillRect(i * 60, 120 - height, 40, height);
  ctx.fillStyle = "#000";
  ctx.font = "10px sans-serif";
  const labels = ["Today", "Avg", "Total"];
  ctx.fillText(labels[i], x, 135);
  });
}

// Stats
function loadStats() {
  chrome.storage.local.get(["stats"], (res) => {
    const stats = res.stats || { totalBlocked: 0, todayBlocked: 0 };

    document.getElementById("statsBlock").innerHTML = `
      <div><strong>${stats.totalBlocked}</strong> total</div>
      <div><strong>${stats.todayBlocked}</strong> today</div>
    `;

    drawGraph(stats);
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  loadStats();

  const btn = document.getElementById("readMoreBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("information.html")
      });
    });
  }

  chrome.storage.onChanged.addListener(() => {
    loadData();
    loadStats();
  });
});