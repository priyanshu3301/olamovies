(function () {
  if (window.__omdInterceptorLoaded) return;
  window.__omdInterceptorLoaded = true;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const request = args[0];
    const url = request instanceof Request ? request.url : String(request);

    // 1. Quick check: If it's not our target, don't interfere at all
    if (!url.includes('/api/omd')) {
      return originalFetch.apply(this, args);
    }

    // 2. Proceed with the original request
    const response = await originalFetch.apply(this, args);

    // 3. Logic for intercepted request
    try {
      const clonedRes = response.clone();
      const data = await clonedRes.json();

      if (data?.shortener && data?.isFound) {
        // Fetch the resolved link from your worker
        const workerUrl = `https://short.sad282.workers.dev/?url=${encodeURIComponent(data.shortener)}`;
        const shortRes = await originalFetch(workerUrl);
        const resolvedLink = await shortRes.text();

        data.shortener = resolvedLink;

        // 4. Reconstruct headers carefully
        const newHeaders = new Headers(response.headers);
        newHeaders.delete("content-length"); // Allow browser to recalculate length
        newHeaders.set("content-type", "application/json");

        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
    } catch (err) {
      console.error("⚠️ OMD Interceptor Error:", err);
      // Fallback: return original response so the site doesn't break
      return response;
    }

    return response;
  };

  console.log("🚀 Interceptor optimized and active");
})();