const sensitiveKeywords = [
  "token",
  "auth",
  "session",
  "cookie",
  "jwt",
  "apikey",
  "password",
  "bearer"
];

function detectJWT(data) {

  const jwtRegex =
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

  return jwtRegex.test(data);

}

function detectBase64(data) {

  const base64Regex =
    /([A-Za-z0-9+/]{20,}={0,2})/;

  return base64Regex.test(data);

}

function decodeBase64(str) {

  try {
    return atob(str);
  } catch {
    return null;
  }

}

function calculateEntropy(str) {

  const map = {};

  for (let c of str) {
    map[c] = (map[c] || 0) + 1;
  }

  let entropy = 0;

  for (let char in map) {

    const p = map[char] / str.length;

    entropy -= p * Math.log2(p);

  }

  return entropy;

}

function crossDomain(details) {

  if (!details.initiator) return false;

  try {

    const origin =
      new URL(details.initiator).hostname;

    const target =
      new URL(details.url).hostname;

    return origin !== target;

  } catch {

    return false;

  }

}

function containsSensitiveKeyword(data) {

  const lower = data.toLowerCase();

  for (let word of sensitiveKeywords) {

    if (lower.includes(word)) {
      return true;
    }

  }

  return false;

}

let activePopupWindowId = null;
const popupCooldown = {};

function canShowForKey(key) {
  const now = Date.now();
  if (!popupCooldown[key] || now - popupCooldown[key] > 20_000) {
    popupCooldown[key] = now;
    return true;
  }
  return false;
}

function showPopup(title, message, url, details = "") {
  if (activePopupWindowId !== null) {
    return;
  }

  if (!canShowForKey(title + "|" + url)) {
    return;
  }

  const params = new URLSearchParams({
    title: title || "⚠️ Alert",
    message: message || "No message provided.",
    url: url || "",
    details: details || ""
  });

  const popupUrl = chrome.runtime.getURL(`warning.html?${params.toString()}`);

  chrome.windows.create({
    url: popupUrl,
    type: "popup",
    width: 420,
    height: 300
  }, (win) => {
    if (chrome.runtime.lastError || !win) {
      console.error("Could not open warning popup", chrome.runtime.lastError);
      return;
    }
    activePopupWindowId = win.id;
  });
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === activePopupWindowId) {
    activePopupWindowId = null;
  }
});

function isCookiePromptUrl(url) {
  const lower = url.toLowerCase();
  return (
    lower.includes("cookie") ||
    lower.includes("consent") ||
    lower.includes("gdpr") ||
    lower.includes("privacy") ||
    lower.includes("agree")
  );
}

function analyzeRequest(details) {

  let riskScore = 0;

  const url = details.url;

  if (containsSensitiveKeyword(url)) {
    riskScore += 20;
  }

  if (crossDomain(details)) {
    riskScore += 30;
  }

  if (detectJWT(url)) {
    riskScore += 40;
  }

  if (detectBase64(url)) {

    const matches =
      url.match(/([A-Za-z0-9+/]{20,}={0,2})/);

    if (matches) {

      const decoded =
        decodeBase64(matches[0]);

      if (decoded && containsSensitiveKeyword(decoded)) {

        riskScore += 40;

      }

    }

  }

  const entropy =
    calculateEntropy(url);

  if (entropy > 4.5) {

    riskScore += 20;

  }

  if (riskScore > 60) {
    showPopup(
      "⚠️ Possible Data Exfiltration",
      "Suspicious network request detected",
      url,
      `Risk score: ${riskScore}`
    );
  }

  if (isCookiePromptUrl(url)) {
    showPopup(
      "⚠️ Cookie prompt detected",
      "HEY HEY DONT JUST PRESS AGREE - read what you share first.",
      url,
      "Page URL matched cookie/consent terms."
    );
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    analyzeRequest(details);
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.type === "websocket") {
      showPopup(
        "⚠️ Unknown WebSocket connection detected",
        "New WebSocket connection may be suspicious.",
        details.url,
        "WebSocket request type observed."
      );
    }
  },
  { urls: ["<all_urls>"] }
);