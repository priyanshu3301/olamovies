(function () {
  if (window.__omdInterceptorLoaded) return;
  window.__omdInterceptorLoaded = true;

  const originalFetch = window.fetch;

  // ============================================================
  // CONFIG
  // ============================================================

  let url1 = null;
  let url2 = null;
  let url3 = null;


  // ============================================================
  // PROXY FETCH
  // ============================================================

  function proxyFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 15);

      const listener = (event) => {
        if (event.source !== window) return;
        const message = event.data;

        if (message && message.type === "PAGE_PROXY_FETCH_RESULT" && message.requestId === requestId) {
          window.removeEventListener("message", listener);

          if (message.response && message.response.success) {
            resolve({
              ok: message.response.status >= 200 && message.response.status < 300,
              status: message.response.status,
              statusText: message.response.statusText,
              headers: message.response.headers,
              text: () => Promise.resolve(message.response.body),
              json: () => Promise.resolve(JSON.parse(message.response.body))
            });
          } else {
            reject(new Error(message.response ? message.response.error : "Unknown proxy fetch error"));
          }
        }
      };

      window.addEventListener("message", listener);

      window.postMessage({
        type: "PAGE_PROXY_FETCH",
        url,
        options,
        requestId
      }, "*");
    });
  }


  // ============================================================
  // COUNTDOWN
  // ============================================================

  function startCountdown() {
    return new Promise((resolve) => {

      const button = document.querySelector(".visit-btn");

      if (!button) {
        console.warn("⚠️ .visit-btn not found");
        resolve();
        return;
      }

      let remaining = 40;

      button.disabled = true;
      button.style.cursor = "not-allowed";
      button.style.opacity = "0.7";

      button.innerHTML =
        `Please wait ${remaining}s`;

      const timer = setInterval(() => {

        remaining--;

        if (remaining > 0) {

          button.innerHTML =
            `Please wait ${remaining}s`;

        } else {

          clearInterval(timer);

          button.disabled = false;
          button.style.cursor = "pointer";
          button.style.opacity = "1";

          button.innerHTML = `
                        srnky.com
                        <span class="inline-flex">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                        </span>
                    `;

          console.log("✅ Countdown finished");

          resolve();
        }

      }, 1000);
    });
  }


  // ============================================================
  // EXTRACT HIDDEN INPUTS
  // ============================================================

  function extractHiddenInputs(html) {

    const formData = new URLSearchParams();

    const inputRegex =
      /<input\b[^>]*type=["']hidden["'][^>]*>/gi;

    const inputs =
      html.match(inputRegex) || [];


    for (const input of inputs) {

      const nameMatch =
        input.match(
          /\bname=["']([^"']*)["']/i
        );

      if (!nameMatch) continue;


      const valueMatch =
        input.match(
          /\bvalue=["']([^"']*)["']/i
        );


      const name =
        nameMatch[1];

      const value =
        valueMatch
          ? valueMatch[1]
          : "";


      formData.append(
        name,
        value
      );
    }

    return formData;
  }


  // ============================================================
  // EXTRACT ad_form_data
  // ============================================================

  function extractAdFormData(html) {

    // input[name="ad_form_data"]
    let match =
      html.match(
        /<input\b[^>]*name=["']ad_form_data["'][^>]*value=["']([^"']*)["']/i
      );


    if (match) {
      return match[1];
    }


    // textarea[name="ad_form_data"]
    match =
      html.match(
        /<textarea\b[^>]*name=["']ad_form_data["'][^>]*>([\s\S]*?)<\/textarea>/i
      );


    if (match) {
      return match[1].trim();
    }


    return null;
  }


  // ============================================================
  // SHORTENER PROCESS
  //
  // GET url1
  //     ↓
  // POST url1
  //     ↓
  // extract ad_form_data
  //     ↓
  // wait for countdown
  //     ↓
  // POST url3
  //     ↓
  // resolvedLink
  // ============================================================

  async function resolveShortener(countdownPromise) {

    console.log("🔵 Starting shortener process");


    // --------------------------------------------------------
    // 1. GET url1
    // --------------------------------------------------------

    console.log("GET:", url1);

    const getResponse =
      await proxyFetch(url1, {
        method: "GET"
      });


    if (!getResponse.ok) {

      throw new Error(
        `GET failed: ${getResponse.status}`
      );
    }


    const html =
      await getResponse.text();


    // --------------------------------------------------------
    // 2. Extract hidden fields
    // --------------------------------------------------------

    const formData =
      extractHiddenInputs(html);


    console.log(
      "Extracted values:",
      Object.fromEntries(formData)
    );


    // --------------------------------------------------------
    // 3. POST url1
    // --------------------------------------------------------

    console.log("POST:", url1);

    const postResponse =
      await proxyFetch(url1, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8"
        },

        body:
          formData.toString()
      });


    if (!postResponse.ok) {

      throw new Error(
        `POST failed: ${postResponse.status}`
      );
    }


    const postHtml =
      await postResponse.text();


    // --------------------------------------------------------
    // 4. Extract ad_form_data
    // --------------------------------------------------------

    const adFormData =
      extractAdFormData(postHtml);


    if (!adFormData) {

      throw new Error(
        "ad_form_data not found"
      );
    }


    console.log(
      "✅ ad_form_data extracted"
    );


    // --------------------------------------------------------
    // 5. Wait for countdown
    // --------------------------------------------------------

    console.log(
      "⏳ Waiting for countdown..."
    );

    await countdownPromise;


    console.log(
      "✅ Countdown completed"
    );


    // --------------------------------------------------------
    // 6. Final POST → url3
    // --------------------------------------------------------

    const finalForm =
      new URLSearchParams();


    finalForm.append(
      "_method",
      "POST"
    );


    finalForm.append(
      "ad_form_data",
      adFormData
    );


    console.log(
      "POST:",
      url3
    );


    const finalResponse =
      await proxyFetch(
        url3,
        {

          method: "POST",

          headers: {

            "Accept":
              "application/json, text/javascript, */*; q=0.01",

            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8",

            "X-Requested-With":
              "XMLHttpRequest"

          },

          body:
            finalForm.toString()
        }
      );


    const finalText =
      await finalResponse.text();


    console.log(
      "Final response:",
      finalText
    );


    // --------------------------------------------------------
    // 7. Parse final response
    // --------------------------------------------------------

    let result;

    try {

      result =
        JSON.parse(finalText);

    } catch {

      throw new Error(
        "Final response is not valid JSON"
      );
    }


    if (
      result.status !== "success" ||
      !result.url
    ) {

      throw new Error(
        "Shortener request failed"
      );
    }


    console.log(
      "🎯 Resolved URL:",
      result.url
    );


    return result.url;
  }


  // ============================================================
  // FETCH INTERCEPTOR
  // ============================================================

  window.fetch =
    async function (...args) {

      const request =
        args[0];


      const requestUrl =
        request instanceof Request
          ? request.url
          : String(request);


      // ----------------------------------------------------
      // Ignore requests other than /api/generate
      // ----------------------------------------------------

      if (
        !requestUrl.includes(
          "/api/generate"
        )
      ) {

        return originalFetch.apply(
          this,
          args
        );
      }


      console.log(
        "🎯 /api/generate intercepted"
      );


      // ====================================================
      // 1. MAKE ORIGINAL REQUEST
      // ====================================================

      const response =
        await originalFetch.apply(
          this,
          args
        );


      // ====================================================
      // 2. INSPECT RESPONSE
      // ====================================================

      try {

        const clonedResponse =
          response.clone();


        const data =
          await clonedResponse.json();


        console.log(
          "📦 /api/generate response:",
          data
        );


        // =================================================
        // 3. CHECK CONDITIONS
        //
        // Only run the process when:
        //
        // data.isFound === true
        // AND
        // data.shortener === url1
        // =================================================

        if (data?.isFound === true && (data?.shortenedShortener === "srnky.com" || data?.shortenedShortener === "clksz.com")) {

          if(data?.shortenedShortener === "srnky.com"){
            url2 = "https://loanbixby.com";
          }
          if(data?.shortenedShortener === "clksz.com"){
            url2 = "https://financeguidz.com/";
          }

          console.log(
            "🎯 Target shortener detected"
          );

          url1 = data?.shortener;

          url3 = new URL(url1).origin + "/links/go";


          // =============================================
          // Start countdown
          // =============================================

          const countdownPromise =
            startCountdown();


          // =============================================
          // Start GET → POST immediately
          //
          // This runs while countdown is running.
          // =============================================

          const resolvedLinkPromise =
            resolveShortener(
              countdownPromise
            );


          // =============================================
          // Wait for the entire process
          // =============================================

          const resolvedLink =
            await resolvedLinkPromise;


          console.log(
            "✅ Resolved link:",
            resolvedLink
          );


          // =============================================
          // Replace shortener
          // =============================================

          data.shortener =
            resolvedLink;

          data.shortenedShortener = "Bypassed";


          // =============================================
          // Rebuild response
          // =============================================

          const newHeaders =
            new Headers(
              response.headers
            );


          newHeaders.delete(
            "content-length"
          );


          newHeaders.set(
            "content-type",
            "application/json"
          );


          return new Response(
            JSON.stringify(data),
            {

              status:
                response.status,

              statusText:
                response.statusText,

              headers:
                newHeaders
            }
          );
        }


        // =================================================
        // Condition didn't match
        // =================================================

        console.log(
          "ℹ️ Shortener does not match url1. Returning original response."
        );


        return response;


      } catch (error) {

        console.error(
          "⚠️ Interceptor error:",
          error
        );


        // Never break the website if our
        // interception logic fails.
        return response;
      }
    };


  console.log(
    "🚀 OMD interceptor active"
  );

})();