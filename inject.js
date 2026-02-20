function removead() {
  const originalOpen = window.open;

  window.open = function(url, target, features) {
      if (url.includes("madurird.com")) {
          console.log("Blocked suspicious popup:", url);
          return null;
      }

      return originalOpen.call(this, url, target, features);
  };
  console.log("✅ Removed madurird.com");
};




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

