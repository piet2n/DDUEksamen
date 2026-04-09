const toggle = document.getElementById("autoDenyToggle");
const trackerCountEl = document.getElementById("trackerCount");
const statusText = document.getElementById("statusText");

// Load toggle
chrome.storage.local.get(["autoDeny"], (result) => {
  toggle.checked = result.autoDeny || false;
});

// Save toggle
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoDeny: toggle.checked });
});

// Load trackers
function loadTrackers() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) return;

    const tabId = tabs[0].id;

    chrome.storage.local.get([`trackers_${tabId}`], (result) => {
      const trackers = result[`trackers_${tabId}`] || [];
      const container = document.getElementById("alerts");

      const count = trackers.length;
      trackerCountEl.innerText = count;

      // Friendly status
      if (count === 0) {
        statusText.innerText = "✅ This site looks safe";
        trackerCountEl.className = "big-number safe";
      } else if (count < 5) {
        statusText.innerText = "⚠️ Some tracking detected";
        trackerCountEl.className = "big-number warn";
      } else {
        statusText.innerText = "🚨 Heavy tracking detected";
        trackerCountEl.className = "big-number danger";
      }

      // List
      if (count > 0) {
        container.innerHTML =
          "<ul>" +
          trackers.map(t => `<li>${formatTracker(t)}</li>`).join("") +
          "</ul>";
      } else {
        container.innerText = "No trackers detected.";
      }
    });
  });
}

// Make names human-readable
function formatTracker(tracker) {
  if (tracker.includes("google")) return "Google tracking";
  if (tracker.includes("facebook")) return "Facebook tracking";
  if (tracker.includes("tiktok")) return "TikTok tracking";
  if (tracker.includes("hotjar")) return "User behavior tracking";
  return tracker;
}

document.addEventListener("DOMContentLoaded", () => {
  loadTrackers();

  chrome.storage.onChanged.addListener(() => {
    loadTrackers();
  });
});