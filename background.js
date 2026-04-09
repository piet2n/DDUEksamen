// ===============================
// 🧨 FILTER LIST (LIKE uBlock)
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

      // Skip invalid tabs
      if (tabId < 0) return { cancel: true };

      const key = `trackers_${tabId}`;

      chrome.storage.local.get([key], (result) => {
        const trackers = result[key] || [];

        if (!trackers.includes(matched)) {
          trackers.push(matched);

          chrome.storage.local.set({ [key]: trackers }, () => {
            updateBadge(tabId, trackers.length);

            // 🔄 force popup refresh
            chrome.storage.local.set({ lastUpdate: Date.now() });
          });
        }
      });

      console.log("Blocked:", matched);
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
// 🎓 Open tutorial on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  }
});