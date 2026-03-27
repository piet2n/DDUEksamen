let detectedElements = new Set();

function detectCookiePopups() {
  const keywords = ["cookie", "cookies", "accept all", "agree", "consent", "gdpr"];
  const elements = document.querySelectorAll("div, section, aside, footer");

  for (const el of elements) {
    const text = el.innerText?.toLowerCase() || "";
    const matches = keywords.some(keyword => text.includes(keyword));

    if (matches && isVisible(el)) {
      const id = el.innerText.slice(0, 100); // simple fingerprint

      if (!detectedElements.has(id)) {
        detectedElements.add(id);

        chrome.runtime.sendMessage({
          type: "COOKIE_POPUP_DETECTED"
        });
      }
    }
  }
}

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 200 &&
    rect.height > 100 &&
    rect.top >= 0 &&
    rect.bottom <= window.innerHeight * 1.5
  );
}

detectCookiePopups();
setInterval(detectCookiePopups, 3000);