// 🔢 Badge
function updateBadge(tabId, count) {
  chrome.action.setBadgeText({
    text: count > 0 ? String(count) : "",
    tabId
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#e74c3c",
    tabId
  });
}

// 🔢 RECEIVE TRACKERS FROM CONTENT SCRIPT
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "TRACKER_DETECTED") {
    const tabId = sender.tab.id;
    const key = `trackers_${tabId}`;

    chrome.storage.local.get([key, "stats"], (result) => {
      const trackers = result[key] || [];

      if (!trackers.includes(msg.tracker)) {
        trackers.push(msg.tracker);

        const stats = result.stats || {
          totalBlocked: 0,
          todayBlocked: 0,
          lastDate: new Date().toDateString()
        };

        const today = new Date().toDateString();

        if (stats.lastDate !== today) {
          stats.todayBlocked = 0;
          stats.lastDate = today;
        }

        stats.totalBlocked += 1;
        stats.todayBlocked += 1;

        chrome.storage.local.set({
          [key]: trackers,
          stats: stats,
          lastUpdate: Date.now()
        });

        updateBadge(tabId, trackers.length);
      }
    });
  }
});

// 🔄 Tab switch
chrome.tabs.onActivated.addListener(({ tabId }) => {
  const key = `trackers_${tabId}`;

  chrome.storage.local.get([key], (result) => {
    const trackers = result[key] || [];
    updateBadge(tabId, trackers.length);
  });
});

// 🧹 Cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`trackers_${tabId}`]);
});

// 🎓 Tutorial on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("hitherehello.html")
    });
  }
});