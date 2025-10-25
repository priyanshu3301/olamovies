// service_worker.js
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase();

    // If hostname starts with olamovies or contains ".olamovies." (covers subdomains and any TLD)
    if (hostname === 'olamovies' || hostname.startsWith('olamovies.') || hostname.includes('.olamovies.') || hostname.endsWith('.olamovies')) {
      // inject content script if not already injected
      // This injects content.js into the page
      await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        files: ['content.js']
      });
    }
  } catch (e) {
    // ignore invalid URLs or injection errors
  }
});
