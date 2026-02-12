function removead() {
const originalFetch = window.fetch;

window.fetch = function(url, options) {
    if (typeof url === "string" && url.includes("madurird.com")) {
        console.warn("Blocked request to:", url);
        return Promise.reject("Blocked domain");
    }
    return originalFetch(url, options);
};

console.log("✅ Removed madurird.com");

  }



async function hello() {
  try {
    const decrypturl = await decryptData();
    showToast("Redirecting to: " + decrypturl,"success");
    replaceAdblockMessage(`
  <div class="adblock-title">
                REDIRECTING...
            </div>
  <div class="adblock-refresh-btn">
                <i class="fas fa-sync-alt"></i> ${decrypturl}
            </div>
`);

    const response = await fetch(`https://short.sad282.workers.dev/?url=${decrypturl}`);
    const responseData = await response.text();
    location.href = responseData;
  } catch (error) {
    console.log("Error:", error);
  }
}

function replaceAdblockMessage(newContent) {
  const target = document.getElementById("adblockMessage");
  if (target) {
    target.innerHTML = newContent;
  }
}
removead();
hello();

