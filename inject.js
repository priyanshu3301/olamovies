async function hello() {
    const decrypturl = await decryptData();
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
    alert(responseData);
    location.href = responseData;
}
hello();
function replaceAdblockMessage(newContent) {
  const target = document.getElementById("adblockMessage");
  if (target) {
    target.innerHTML = newContent;
  }
}

// (async () => {
//       const decrypturl = await decryptData();
//     console.log(`Decrypted URL: ${decrypturl}`);
//     const response = await fetch(`https://short.sad282.workers.dev/?url=${decrypturl}`);
//     const responseData = await response.text();
//     location.href = responseData;
// })();