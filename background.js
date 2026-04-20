const FILTER_LIST = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "tiktok.com",
  "hotjar.com",
  "segment.com"
];

// 🚫 BLOCK TRACKERS (FULL POWER in Firefox)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    const matched = FILTER_LIST.find(rule => url.includes(rule));

    if (!matched) return;

    const tabId = details.tabId;
    if (tabId < 0) return { cancel: true };

    const key = `trackers_${tabId}`;

    chrome.storage.local.get([key, "stats"], (result) => {
      const trackers = result[key] || [];

      if (!trackers.includes(matched)) {
        trackers.push(matched);

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
          stats: stats
        });

        updateBadge(tabId, trackers.length);
      }
    });

    return { cancel: true };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// 🔢 Badge
function updateBadge(tabId, count) {
  chrome.browserAction.setBadgeText({
    text: count > 0 ? String(count) : "",
    tabId
  });

  chrome.browserAction.setBadgeBackgroundColor({
    color: "#e74c3c",
    tabId
  });
}

// 🔄 Tab switch
chrome.tabs.onActivated.addListener(({ tabId }) => {
  const key = `trackers_${tabId}`;
  chrome.storage.local.get([key], (res) => {
    const trackers = res[key] || [];
    updateBadge(tabId, trackers.length);
  });
});

// 🧹 Cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`trackers_${tabId}`]);
});

// 🎓 Tutorial
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("hitherehello.html")
    });
  }
});