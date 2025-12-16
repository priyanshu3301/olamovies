

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
        target: { tabId, allFrames: true },
        files: ["content.js"]
      });
      return; // Stop further processing if it's an olamovies link
    }

  } catch (e) {
    // Added try/catch back from your original file to prevent errors
    console.error("Error in onUpdated listener:", e);
  }
});