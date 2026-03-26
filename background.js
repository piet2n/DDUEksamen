// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "COOKIE_POPUP_DETECTED") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Vinduesrens Warning",
      message: "Cookie popup detected. Review before accepting!"
    });
  }
});