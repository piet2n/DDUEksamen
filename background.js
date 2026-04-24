// BADGE
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

// TRACK DETECTED (FROM CONTENT)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "TRACKER_DETECTED") {
    const tabId = sender.tab?.id;
    if (!tabId) return;

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

        // ⚠️ still counts detected (UI consistency)
        stats.totalBlocked += 1;
        stats.todayBlocked += 1;

        chrome.storage.local.set({
          [key]: trackers,
          stats,
          lastUpdate: Date.now()
        });

        updateBadge(tabId, trackers.length);
      }
    });
  }
});

// REAL BLOCK TRACKING (DNR)
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    const tabId = info.request.tabId;
    if (tabId < 0) return;

    const key = `blocked_${tabId}`;

    chrome.storage.local.get([key], (res) => {
      const list = res[key] || [];
      list.push(info.request.url);

      chrome.storage.local.set({ [key]: list });
    });
  });
}

// TAB SWITCH
chrome.tabs.onActivated.addListener(({ tabId }) => {
  const key = `trackers_${tabId}`;

  chrome.storage.local.get([key], (result) => {
    const trackers = result[key] || [];
    updateBadge(tabId, trackers.length);
  });
});

// CLEANUP
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([
    `trackers_${tabId}`,
    `blocked_${tabId}`
  ]);
});

// ON INSTALL
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("hitherehello.html")
    });
  }
});

// EASYLIST + EASYPRIVACY
const EASYLIST_URL = "https://easylist.to/easylist/easylist.txt";
const EASYPRIVACY_URL = "https://easylist.to/easylist/easyprivacy.txt";

// Convert ABP → DNR-safe
function parseList(text) {
  const lines = text.split("\n");
  const rules = [];
  let id = 1;

  for (let line of lines) {
    line = line.trim();

    if (
      !line ||
      line.startsWith("!") ||
      line.startsWith("@@") ||     // ignore exceptions (for now)
      line.includes("##") ||
      line.includes("#@#")
    ) continue;

    if (line.startsWith("||")) {
      let domain = line
        .replace("||", "")
        .replace("^", "")
        .split("/")[0];

      rules.push({
        id: id++,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: domain,
          resourceTypes: [
            "script",
            "xmlhttprequest",
            "image",
            "sub_frame"
          ]
        }
      });
    }

    // SAFE LIMIT (Chrome-friendly)
    if (rules.length >= 20000) break;
  }

  return rules;
}

// UPDATE FILTERS
async function updateFilters() {
  try {
    const [easylistRes, privacyRes] = await Promise.all([
      fetch(EASYLIST_URL),
      fetch(EASYPRIVACY_URL)
    ]);

    const text =
      (await easylistRes.text()) +
      "\n" +
      (await privacyRes.text());

    const rules = parseList(text);

    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existing.map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: rules
    });

    console.log("✅ Filters loaded:", rules.length);

  } catch (e) {
    console.log("❌ Filter update failed", e);
  }
}

// Run at startup + daily
updateFilters();
setInterval(updateFilters, 24 * 60 * 60 * 1000);