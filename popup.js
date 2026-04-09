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

// Format trackers
function formatTracker(domain) {
  if (domain.includes("google")) return "Google";
  if (domain.includes("facebook")) return "Facebook";
  if (domain.includes("tiktok")) return "TikTok";
  if (domain.includes("hotjar")) return "Hotjar";
  if (domain.includes("segment")) return "Segment";
  if (domain.includes("doubleclick")) return "Google Ads";
  return domain;
}

// Score
function calculateScore(count) {
  let score = 100 - count * 10;
  return score < 0 ? 0 : score;
}

// Status
function getStatus(score) {
  if (score > 80) return { text: "✅ This site respects your privacy", class: "safe" };
  if (score > 50) return { text: "⚠️ Some tracking detected", class: "warn" };
  return { text: "🚨 Heavy tracking detected", class: "danger" };
}

// Load tab data
function loadData() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) return;

    const tabId = tabs[0].id;
    console.log('Loading data for tab:', tabId);

    chrome.storage.local.get([`trackers_${tabId}`], (result) => {
      const trackers = result[`trackers_${tabId}`] || [];
      console.log('Retrieved trackers:', trackers);
      const count = trackers.length;

      trackerCountEl.innerHTML = `<strong>${count}</strong>`;

      const score = calculateScore(count);
      scoreEl.innerText = score;

      const status = getStatus(score);
      statusText.innerText = status.text;
      scoreEl.className = `score ${status.class}`;

      if (count > 0) {
        const unique = [...new Set(trackers.map(formatTracker))];

        trackerListEl.innerHTML =
          "<ul>" +
          unique.map(t => `<li>${t}</li>`).join("") +
          "</ul>";
      } else {
        trackerListEl.innerText = "No known tracking companies detected";
      }
    });
  });
}

// 📊 Load stats
function loadStats() {
  chrome.storage.local.get(["stats"], (res) => {
    const stats = res.stats || {
      totalBlocked: 0,
      todayBlocked: 0
    };

    const el = document.getElementById("statsBlock");

    el.innerHTML = `
      <div><strong>${stats.totalBlocked}</strong> blocked all-time</div>
      <div><strong>${stats.todayBlocked}</strong> blocked today</div>
    `;
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  loadStats();

  chrome.storage.onChanged.addListener(() => {
    loadData();
    loadStats();
  });
});