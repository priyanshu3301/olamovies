function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRedirectUrl(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const match = html.match(/<meta\s+http-equiv=["']refresh["']\s+content=["'][^"]*url=([^"']+)/i);
    if (!match) throw new Error("Meta refresh not found");
    return match[1];
  } catch (err) {
    console.error("Error fetching redirect URL:", err);
    return null;
  }
}


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
    console.log(urlObj)

    // 2️⃣ Handle gplinks.co bare link
    // (This logic is now at the top level, not nested in a redundant 'if' check)
    if (
      urlObj.hostname === "gplinks.co"
    ) {
      console.log("Intercepted bare gplinks.co URL:", tab.url);

      const redirectUrl = await getRedirectUrl(tab.url);
      if (!redirectUrl) return;

      const parsed = new URL(redirectUrl);
      const lid = atob(parsed.searchParams.get("lid"));
      const pid = atob(parsed.searchParams.get("pid"));
      const vid = parsed.searchParams.get("vid");

      console.log("Parsed values:", { lid, pid, vid });

      const finalUrl = `https://gplinks.co/${lid}?pid=${pid}&vid=${vid}`;

      // Close tab and open countdown page
      await chrome.tabs.remove(tabId);
      chrome.tabs.create({
        url: chrome.runtime.getURL("countdown.html") +
          `?target=${encodeURIComponent(finalUrl)}`
      });

      for (let i = 1; i <= 3; i++) {
        const formData = new URLSearchParams({
          form_name: "ads-track-data",
          step_id: i.toString(),
          ad_impressions: "0",
          visitor_id: vid,
          next_target: ""
        });

        await fetch(parsed.origin + parsed.pathname, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": redirectUrl,
            "Cookie": `lid=${lid}; pid=${pid}; pages=${i}; imps=0; vid=${vid}; step_count=${i}`
          },
          body: formData,
          redirect: "manual"
        });

        await delay(500); // Make sure 'delay' function is defined elsewhere
      }
    }

  } catch (e) {
    // Added try/catch back from your original file to prevent errors
    console.error("Error in onUpdated listener:", e);
  }
});