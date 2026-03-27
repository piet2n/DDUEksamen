chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "COOKIE_POPUP_DETECTED" && sender.tab) {
    const tabId = sender.tab.id;
    const key = `alerts_${tabId}`;

    chrome.storage.local.get([key], (result) => {
      const alerts = result[key] || [];

      if (!alerts.includes("Cookie popup detected")) {
        alerts.push("Cookie popup detected");

        chrome.storage.local.set({ [key]: alerts }, () => {
          updateBadge(tabId, alerts.length);
        });
      }
    });
  }
});

// 🔢 Badge updater
function updateBadge(tabId, count) {
  chrome.action.setBadgeText({
    text: count > 0 ? String(count) : "",
    tabId: tabId
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#e74c3c", // red
    tabId: tabId
  });
}

// 🧹 Clean up when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`alerts_${tabId}`]);
});

// 🔄 When user switches tabs → update badge
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;

  chrome.storage.local.get([`alerts_${tabId}`], (result) => {
    const alerts = result[`alerts_${tabId}`] || [];
    updateBadge(tabId, alerts.length);
  });
});