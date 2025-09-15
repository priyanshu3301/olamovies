// The HTML content for your error/countdown page
const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Retrying...</title>
    <!-- Tailwind CSS for styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-900 text-white flex items-center justify-center min-h-screen">

    <div class="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
        <h1 class="text-4xl md:text-5xl font-bold text-red-400 mb-4">An Error Occurred</h1>
        <p id="message" class="text-2xl font-bold text-cyan-400"></p>
        <p class="mt-4 text-lg text-gray-300">We couldn't get the final destination. Retrying shortly...</p>
    </div>

    <script>
        // --- Countdown Logic ---

        // The element where the message will be displayed
        const messageElement = document.getElementById('message');

        // Set the initial countdown time in seconds
        let countdown = 5;

        // Function to update the countdown message
        function updateCountdown() {
            if (countdown > 0) {
                // Update the text to show the remaining time
                messageElement.textContent = \`Retrying in \${countdown} second\${countdown === 1 ? '' : 's'}\`;
                countdown--; // Decrement the counter
            } else {
                // When the countdown is over, stop the interval and reload the page to try again
                clearInterval(intervalId);
                location.reload();
            }
        }

        // Call the function immediately to show the initial message
        updateCountdown();

        // Set an interval to call the updateCountdown function every 1 second (1000 milliseconds)
        const intervalId = setInterval(updateCountdown, 1000);
    </script>

</body>
</html>

`;


export default {
  /**
   * The main fetch handler for the Cloudflare Worker.
   * @param {Request} request The incoming request.
   * @returns {Promise<Response>} The response to send back.
   */
  async fetch(request) {
    // Example incoming URL: 
    // https://lively-bird-e78f.conifnun.workers.dev/?url=[TARGET_URL]&ad_form_data=[...long string...]&_csrfToken=[...]&_Token[fields]=[...]&_Token[unlocked]=[...]
    const url = new URL(request.url);

    // Get the target API endpoint from the 'url' parameter.
    const targetApiUrl = url.searchParams.get("url");
    // Get the primary payload from the 'ad_form_data' parameter.
    const data = url.searchParams.get("ad_form_data");
    // Get the additional tokens required for the payload.
    const csrfToken = url.searchParams.get("_csrfToken");
    const tokenFields = url.searchParams.get("_Token[fields]");
    const tokenUnlocked = url.searchParams.get("_Token[unlocked]");

    // If the core 'url' or 'data' parameters are missing, return an error.
    if (!targetApiUrl || !data) {
      return new Response("Missing required 'url' or 'data' parameter.", { status: 400 });
    }
    
    // Security check: Ensure the provided URL parameter is a valid HTTP/HTTPS URL.
    try {
      const parsedApiUrl = new URL(targetApiUrl);
      if (parsedApiUrl.protocol !== 'http:' && parsedApiUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
      }
    } catch (e) {
      return new Response("Invalid 'url' parameter. Must be a valid HTTP/HTTPS URL.", { status: 400 });
    }

    // Assemble all form data into a single payload object.
    const payload = { data, csrfToken, tokenFields, tokenUnlocked };

    // Call the helper function with the dynamic API URL and the complete payload.
    const target = await getFinalUrl(targetApiUrl, payload);

    // If the API call was successful and returned a valid URL, redirect the user.
    if (target && target.status === "success" && target.url) {
      return new Response(null, {
        status: 302, // Temporary Redirect
        headers: {
          "Location": target.url
        }
      });
    } else {
      // If the API call failed, show a user-friendly error page.
      return new Response(errorHtml, {
        status: 500, // Internal Server Error
        headers: {
          'Content-Type': 'text/html;charset=UTF-8'
        }
      });
    }
  }
};

/**
 * Sends a POST request to the specified API URL with a dynamic payload.
 * @param {string} apiUrl The URL of the external API to call.
 * @param {object} payload An object containing the data for the POST body.
 * @returns {Promise<object>} A promise that resolves to the JSON response from the API.
 */
async function getFinalUrl(apiUrl, payload) {
  // Initialize the parameters for the request body.
  const bodyParams = {
    _method: "POST",
    // The target API expects the main payload under the key 'ad_form_data'.
    // We are mapping our 'data' URL parameter to this key.
    ad_form_data: payload.data,
  };

  // Dynamically add the other tokens to the payload body ONLY if they were provided in the URL.
  // This prevents sending keys with 'null' or 'undefined' values.
  if (payload.csrfToken) {
    bodyParams._csrfToken = payload.csrfToken;
  }
  if (payload.tokenFields) {
    // Use bracket notation for keys that contain special characters like '[' and ']'.
    bodyParams['_Token[fields]'] = payload.tokenFields;
  }
  if (payload.tokenUnlocked) {
    bodyParams['_Token[unlocked]'] = payload.tokenUnlocked;
  }

  // Convert the JavaScript object into a URL-encoded string for the request body.
  const body = new URLSearchParams(bodyParams).toString();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        // Add any other necessary headers here.
      },
      body,
    });
    
    return await response.json();

  } catch (error) {
    console.error(`API fetch to ${apiUrl} failed:`, error);
    return { status: "error", message: error.message, url: null };
  }
}
