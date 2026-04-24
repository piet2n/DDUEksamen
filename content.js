// FINGERPRINTING BLOCKING
function blockFingerprinting() {
  try {
    HTMLCanvasElement.prototype.toDataURL = function () {
      return "data:image/png;base64,blocked";
    };

    WebGLRenderingContext.prototype.getParameter = function () {
      return null;
    };

    AudioBuffer.prototype.getChannelData = function () {
      return new Float32Array(0);
    };
  } catch {}
}

// COOKIE HANDLING
function handleCookiebot() {
  try {
    const btn = document.querySelector("#CybotCookiebotDialogBodyButtonDecline");
    if (btn) {
      btn.click();
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
      return true;
    }

    const settingsBtn = document.querySelector("#onetrust-pc-btn-handler");
    if (settingsBtn) {
      settingsBtn.click();

      setTimeout(() => {
        try {
          const confirmBtn = document.querySelector(".save-preference-btn");
          if (confirmBtn) confirmBtn.click();
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

    chrome.storage.local.get(["autoDeny"], (result) => {
      if (!result?.autoDeny) return;

      if (handleCookiebot()) return;
      if (handleOneTrust()) return;

      const elements = document.querySelectorAll("button, a, div");

      const keywords = [
        "reject","deny","decline","only necessary","essential",
        "accept only necessary",
        "afvis","afslå","afvis alle",
        "kun nødvendige","nødvendige"
      ];

      for (const el of elements) {
        const text = el.innerText?.toLowerCase() || "";

        if (keywords.some(k => text.includes(k))) {
          try { el.click(); } catch {}
          return;
        }
      }
    });
  } catch {}
}

// TRACKER DETECTION
// Friendly names for UI
const COMPANY_MAP = {
  "google": "Google",
  "doubleclick": "Google Ads",
  "googletagmanager": "Google Tag Manager",
  "facebook": "Facebook",
  "meta": "Meta",
  "tiktok": "TikTok",
  "hotjar": "Hotjar",
  "segment": "Segment",
  "bing": "Microsoft",
  "amazon": "Amazon",
  "cloudflare": "Cloudflare"
};

const detectedTrackers = new Set();

// Extract domain safely
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// Convert domain → company name
function getCompanyName(domain) {
  for (const key in COMPANY_MAP) {
    if (domain.includes(key)) return COMPANY_MAP[key];
  }
  return domain;
}

// Detect ANY 3rd-party request (not hardcoded list)
function detectTrackers() {
  try {
    const resources = performance.getEntriesByType("resource");
    const pageDomain = location.hostname;

    resources.forEach((res) => {
      const url = res.name || "";
      const domain = getDomain(url);

      // Ignore same-origin
      if (!domain || domain.includes(pageDomain)) return;

      // Only track once
      if (!detectedTrackers.has(domain)) {
        detectedTrackers.add(domain);

        try {
          chrome.runtime.sendMessage({
            type: "TRACKER_DETECTED",
            tracker: getCompanyName(domain)
          });
        } catch {}
      }
    });
  } catch {}
}

// SPA-SAFE LOOP
blockFingerprinting();
detectTrackers();

// Watch for cookie popups dynamically
const observer = new MutationObserver(() => {
  autoDenyCookies();
});

observer.observe(document, { childList: true, subtree: true });

// Poll trackers (for lazy-loaded scripts)
setInterval(() => {
  detectTrackers();
}, 3000);