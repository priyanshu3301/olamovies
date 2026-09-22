chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only run when the tab is loading and has a URL
  if (changeInfo.status !== "loading" || !tab.url) return;

  try {
    const urlObj = new URL(tab.url);

    // 1️⃣ Handle olamovies injection
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === "olamovies" ||
      hostname.startsWith("olamovies.") ||
      hostname.includes(".olamovies.")
    ) {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: ["content.js"]
      });
      return; // Stop further processing if it's an olamovies link
    }

  } catch (e) {
    // Added try/catch back from your original file to prevent errors
    console.error("Error in onUpdated listener:", e);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "PROXY_FETCH") {
    return;
  }

  (async () => {
    try {
      const response = await fetch(message.url, {
        method: message.options?.method || "GET",
        headers: message.options?.headers || {},
        body: message.options?.body,
        credentials: message.options?.credentials || "include",
        redirect: message.options?.redirect || "follow"
      });

      const text = await response.text();

      sendResponse({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text
      });

    } catch (error) {

      console.error("Proxy fetch error:", error);

      sendResponse({
        success: false,
        error: error.message
      });
    }
  })();

  return true;
});