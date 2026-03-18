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

function alertUser(message, url) {

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "⚠️ Possible Data Exfiltration",
    message: message + "\n" + url
  });

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

    alertUser(
      "Suspicious network request detected",
      url
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

      alertUser(
        "Unknown WebSocket connection detected",
        details.url
      );

    }

  },

  { urls: ["<all_urls>"] }

);