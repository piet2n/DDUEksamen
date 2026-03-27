// ===============================
// 🧠 TRACKER DETECTION
// ===============================

let detectedTrackers = new Set();

const TRACKERS = [
  { name: "Google Analytics", pattern: "google-analytics.com" },
  { name: "Google Tag Manager", pattern: "googletagmanager.com" },
  { name: "Meta Pixel", pattern: "facebook.net" },
  { name: "TikTok Pixel", pattern: "tiktok.com" },
  { name: "Hotjar", pattern: "hotjar.com" },
  { name: "Segment", pattern: "segment.com" }
];

// Detect trackers via <script>
function detectTrackersFromScripts() {
  const scripts = document.querySelectorAll("script[src]");

  scripts.forEach(script => {
    const src = script.src;

    TRACKERS.forEach(tracker => {
      if (src.includes(tracker.pattern)) {
        registerTracker(tracker.name);
      }
    });
  });
}

// Intercept network requests
(function interceptNetwork() {
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    checkRequest(args[0]);
    return origFetch.apply(this, args);
  };

  const origXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const xhr = new origXHR();
    const origOpen = xhr.open;

    xhr.open = function (method, url) {
      checkRequest(url);
      return origOpen.apply(this, arguments);
    };

    return xhr;
  };
})();

function checkRequest(url) {
  if (!url) return;

  TRACKERS.forEach(tracker => {
    if (url.includes(tracker.pattern)) {
      registerTracker(tracker.name);
    }
  });
}

// Send tracker to background (deduplicated)
function registerTracker(name) {
  if (!detectedTrackers.has(name)) {
    detectedTrackers.add(name);

    chrome.runtime.sendMessage({
      type: "TRACKER_DETECTED",
      tracker: name
    });
  }
}

// ===============================
// 🍪 COOKIE AUTO-DENY
// ===============================

// Cookiebot handler
function handleCookiebot() {
  const btn = document.querySelector("#CybotCookiebotDialogBodyButtonDecline");
  if (btn) {
    btn.click();
    console.log("Cookiebot rejected");
    return true;
  }
  return false;
}

// OneTrust handler
function handleOneTrust() {
  const rejectBtn = document.querySelector("#onetrust-reject-all-handler");

  if (rejectBtn) {
    rejectBtn.click();
    console.log("OneTrust rejected");
    return true;
  }

  const settingsBtn = document.querySelector("#onetrust-pc-btn-handler");

  if (settingsBtn) {
    settingsBtn.click();

    setTimeout(() => {
      const confirmBtn = document.querySelector(".save-preference-btn");
      if (confirmBtn) {
        confirmBtn.click();
        console.log("OneTrust rejected via settings");
      }
    }, 500);

    return true;
  }

  return false;
}

// Generic fallback (EN + DK)
function autoDenyCookies() {
  chrome.storage.local.get(["autoDeny"], (result) => {
    if (!result.autoDeny) return;

    // Try smart handlers first
    if (handleCookiebot()) return;
    if (handleOneTrust()) return;

    const elements = document.querySelectorAll("button, a, div");

    const keywords = [
      // English
      "reject", "deny", "decline", "only necessary", "essential",

      // Danish 🇩🇰
      "afvis", "afslå", "afvis alle",
      "kun nødvendige", "nødvendige",
      "tillad nødvendige"
    ];

    for (const el of elements) {
      const text = el.innerText?.toLowerCase().trim() || "";

      if (!text) continue;

      const matches = keywords.some(k => text.includes(k));

      if (matches && isClickable(el)) {
        el.click();
        console.log("Auto-denied (fallback):", text);
        return;
      }
    }
  });
}

// Check if element is clickable
function isClickable(el) {
  const style = window.getComputedStyle(el);

  return (
    el.offsetParent !== null &&
    (style.cursor === "pointer" ||
      el.tagName === "BUTTON" ||
      el.tagName === "A")
  );
}

// Try inside iframes (best effort)
function scanIframes() {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) continue;

      const buttons = doc.querySelectorAll("button");

      for (const btn of buttons) {
        const text = btn.innerText?.toLowerCase() || "";

        if (
          text.includes("reject") ||
          text.includes("afvis")
        ) {
          btn.click();
          console.log("Rejected inside iframe");
          return;
        }
      }
    } catch (e) {
      // Cross-origin iframe → ignore
    }
  }
}

// ===============================
// 🔁 EXECUTION LOOP
// ===============================

// Fast initial attempts (catch early popups)
let attempts = 0;
const fastInterval = setInterval(() => {
  detectTrackersFromScripts();
  autoDenyCookies();
  scanIframes();

  attempts++;
  if (attempts > 10) clearInterval(fastInterval);
}, 500);

// Slower ongoing scan
setInterval(() => {
  detectTrackersFromScripts();
  autoDenyCookies();
  scanIframes();
}, 3000);

// Initial run
detectTrackersFromScripts();
autoDenyCookies();
scanIframes();