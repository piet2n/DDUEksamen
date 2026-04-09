// ===============================
// 🧨 FINGERPRINTING BLOCKING
// ===============================
function blockFingerprinting() {
  try {
    HTMLCanvasElement.prototype.toDataURL = function () {
      console.log("Blocked Canvas fingerprinting");
      return "data:image/png;base64,blocked";
    };
    WebGLRenderingContext.prototype.getParameter = function () {
      console.log("Blocked WebGL fingerprinting");
      return null;
    };
    AudioBuffer.prototype.getChannelData = function () {
      console.log("Blocked Audio fingerprinting");
      return new Float32Array(0);
    };
  } catch {}
}

// ===============================
// 🍪 COOKIE HANDLING
// ===============================
function handleCookiebot() {
  try {
    const btn = document.querySelector("#CybotCookiebotDialogBodyButtonDecline");
    if (btn) {
      btn.click();
      console.log("Cookiebot rejected");
      return true;
    }
  } catch {}
  return false;
}

function handleOneTrust() {
  try {
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
        try {
          const confirmBtn = document.querySelector(".save-preference-btn");
          if (confirmBtn) confirmBtn.click();
          console.log("OneTrust rejected via settings");
        } catch {}
      }, 500);
      return true;
    }
  } catch {}
  return false;
}

function autoDenyCookies() {
  try {
    if (!chrome?.runtime?.id) return;
    // Use try/catch around Chrome API
    try {
      chrome.storage.local.get(["autoDeny"], (result) => {
        if (!result?.autoDeny) return;
        if (handleCookiebot()) return;
        if (handleOneTrust()) return;

        const elements = document.querySelectorAll("button, a, div");
        const keywords = [
          "reject","deny","decline","only necessary","essential",
          "afvis","afslå","afvis alle","kun nødvendige","nødvendige","tillad nødvendige"
        ];

        for (const el of elements) {
          const text = el.innerText?.toLowerCase() || "";
          if (keywords.some(k => text.includes(k))) {
            try { el.click(); console.log("Auto-denied (fallback):", text); } catch {}
            return;
          }
        }
      });
    } catch {}
  } catch {}
}

// ===============================
// 🔢 TRACKER DETECTION
// ===============================
const TRACKERS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "tiktok.com",
  "hotjar.com",
  "segment.com"
];
const detectedTrackers = new Set();

function detectTrackers() {
  try {
    const resources = performance.getEntriesByType("resource");
    resources.forEach((res) => {
      const url = res.name || "";
      TRACKERS.forEach(tracker => {
        if (url.includes(tracker) && !detectedTrackers.has(tracker)) {
          detectedTrackers.add(tracker);
          try {
            chrome.runtime.sendMessage({ type: "TRACKER_DETECTED", tracker });
          } catch {}
        }
      });
    });
  } catch {}
}

// ===============================
// 🔁 SPA-SAFE LOOP
// ===============================
blockFingerprinting();
detectTrackers();

// Observe DOM for cookie popups
const observer = new MutationObserver(() => autoDenyCookies());
observer.observe(document, { childList: true, subtree: true });

// Poll trackers every 3s
setInterval(() => detectTrackers(), 3000);