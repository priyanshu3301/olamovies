async function hello() {
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
}

function replaceAdblockMessage(newContent) {
  const target = document.getElementById("adblockMessage");
  if (target) {
    target.innerHTML = newContent;
  }
}
hello();