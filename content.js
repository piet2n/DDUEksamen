function detectCookiePopups() {
  const keywords = [
    "cookie",
    "cookies",
    "accept all",
    "agree",
    "consent",
    "gdpr"
  ];

  const elements = document.querySelectorAll("div, section, aside, footer");

  elements.forEach(el => {
    const text = el.innerText?.toLowerCase() || "";

    const matches = keywords.some(keyword => text.includes(keyword));

    if (matches && isVisible(el)) {
      chrome.runtime.sendMessage({ type: "COOKIE_POPUP_DETECTED" });
    }
  });
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

// Run detection periodically
setInterval(detectCookiePopups, 3000);

// Initial run
detectCookiePopups();