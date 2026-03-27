// Known tracker domains
const TRACKER_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "facebook.net",
  "connect.facebook.net",
  "tiktok.com",
  "analytics.tiktok.com",
  "hotjar.com",
  "segment.com"
];

// 🚫 BLOCK TRACKERS
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;

    const blocked = TRACKER_DOMAINS.some(domain => url.includes(domain));

    if (blocked) {
      console.log("Blocked tracker:", url);

      // Store blocked tracker
      const tabId = details.tabId;
      if (tabId >= 0) {
        const key = `trackers_${tabId}`;

        chrome.storage.local.get([key], (result) => {
          const trackers = result[key] || [];

          const domain = new URL(url).hostname;

          if (!trackers.includes(domain)) {
            trackers.push(domain);

            chrome.storage.local.set({ [key]: trackers }, () => {
              updateBadge(tabId, trackers.length);
            });
          }
        });
      }

      return { cancel: true }; // 💥 BLOCK IT
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// 🔢 Badge updater
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