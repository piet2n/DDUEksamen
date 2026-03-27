function loadAlerts() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;

    const tabId = tabs[0].id;

    chrome.storage.local.get([`alerts_${tabId}`], (result) => {
      const alerts = result[`alerts_${tabId}`] || [];
      const container = document.getElementById("alerts");

      if (alerts.length > 0) {
        container.innerHTML =
          `<strong>${alerts.length} tracker(s) detected:</strong>` +
          "<ul>" +
          alerts.map(a => `<li>${a}</li>`).join("") +
          "</ul>";
      } else {
        container.innerText = "No alerts yet.";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAlerts();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      loadAlerts();
    }
  });
});