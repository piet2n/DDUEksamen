// ===============================
// 🧨 FILTER LIST
// ===============================

const FILTER_LIST = [
  "doubleclick.net",
  "google-analytics.com",
  "googletagmanager.com",
  "facebook.net",
  "connect.facebook.net",
  "analytics.tiktok.com",
  "tiktok.com",
  "hotjar.com",
  "segment.com",
  "mixpanel.com",
  "ads-twitter.com",
  "snapchat.com",
  "bing.com/analytics"
];

// 🚫 BLOCK REQUESTS
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    const matched = FILTER_LIST.find(rule => url.includes(rule));

    if (matched) {
      const tabId = details.tabId;
      if (tabId < 0) return { cancel: true };

      const key = `trackers_${tabId}`;

      chrome.storage.local.get([key, "stats"], (result) => {
        const trackers = result[key] || [];

        // Only count once per domain per tab
        if (!trackers.includes(matched)) {
          trackers.push(matched);

          // 📊 STATS
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

      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

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

// 🎓 OPEN TUTORIAL
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  }
});