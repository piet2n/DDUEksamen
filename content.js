// ===============================
// 🧨 FINGERPRINTING BLOCKING
// ===============================

function blockFingerprinting() {
  // Canvas
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function () {
    console.log("Blocked Canvas fingerprinting");
    return "data:image/png;base64,blocked";
  };

  // WebGL
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function () {
    console.log("Blocked WebGL fingerprinting");
    return null;
  };

  // Audio
  const originalGetChannelData = AudioBuffer.prototype.getChannelData;
  AudioBuffer.prototype.getChannelData = function () {
    console.log("Blocked Audio fingerprinting");
    return new Float32Array(0);
  };
}

// ===============================
// 🍪 COOKIE HANDLING
// ===============================

function handleCookiebot() {
  const btn = document.querySelector("#CybotCookiebotDialogBodyButtonDecline");
  if (btn) {
    btn.click();
    return true;
  }
  return false;
}

function handleOneTrust() {
  const rejectBtn = document.querySelector("#onetrust-reject-all-handler");

  if (rejectBtn) {
    rejectBtn.click();
    return true;
  }

  const settingsBtn = document.querySelector("#onetrust-pc-btn-handler");

  if (settingsBtn) {
    settingsBtn.click();

    setTimeout(() => {
      const confirmBtn = document.querySelector(".save-preference-btn");
      if (confirmBtn) confirmBtn.click();
    }, 500);

    return true;
  }

  return false;
}

function autoDenyCookies() {
  chrome.storage.local.get(["autoDeny"], (result) => {
    if (!result.autoDeny) return;

    if (handleCookiebot()) return;
    if (handleOneTrust()) return;

    const elements = document.querySelectorAll("button, a, div");

    const keywords = [
      "reject","deny","decline","only necessary","essential",
      "afvis","afslå","afvis alle",
      "kun nødvendige","nødvendige","tillad nødvendige"
    ];

    for (const el of elements) {
      const text = el.innerText?.toLowerCase() || "";

      if (keywords.some(k => text.includes(k))) {
        el.click();
        return;
      }
    }
  });
}

// ===============================
// 🔁 LOOP
// ===============================

blockFingerprinting();

let attempts = 0;
const fast = setInterval(() => {
  autoDenyCookies();

  attempts++;
  if (attempts > 10) clearInterval(fast);
}, 500);

setInterval(() => {
  autoDenyCookies();
}, 3000);