const toggle = document.getElementById("autoDenyToggle");

// Load toggle state
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

      if (trackers.length > 0) {
        container.innerHTML =
          `<strong>${trackers.length} tracker(s) detected:</strong>` +
          "<ul>" +
          trackers.map(t => `<li>${t}</li>`).join("") +
          "</ul>";
      } else {
        container.innerText = "No trackers yet.";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTrackers();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      loadTrackers();
    }
  });
});