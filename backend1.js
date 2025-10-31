/**
 * Cloudflare Worker API Router with CORS fix
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function textResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      ...CORS_HEADERS,
    },
  });
}

function extractInputValue(name, html) {

  const escapedName = name.replace(/\[/g, '\\[').replace(/\]/g, '\\]');

  const regex = new RegExp(`<input[^>]+name=["']${escapedName}["'][^>]*value=["']([^"']+)["']`, "i");

  // Execute the regex against the HTML content.
  const match = html.match(regex);

  return match ? match[1] : null;
}

// --- Domain-Specific Handlers ---

function handleApiDomain(url) {
  const user = url.searchParams.get('user');
  if (!user) {
    return jsonResponse({ error: 'Query parameter "user" is required.' }, 400);
  }
  const responseData = {
    message: `Hello, ${user}!`,
    timestamp: new Date().toISOString(),
    domain: 'api.example.com',
  };
  return jsonResponse(responseData);
}

function handleStatusDomain(url) {
  const service = url.searchParams.get('service') || 'system';
  return textResponse(`Status for ${service}: OK`);
}
async function linksconsole(url) {
  const response = await fetch(url, { redirect: "manual" });
  const location = response.headers.get("location");

  if (!location) throw new Error("No redirect location found");

  const loc = new URL(location);
  const token = loc.searchParams.get("token");

  const payload = {
    token: token
  };

  const res = await fetch("https://linksconsole.com/get-link.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return textResponse(data.url);
}


async function tpi(targetUrl) {
  const urlString = new URL(targetUrl);

  try {

    const resp = await fetch(targetUrl);
    const htmlText = await resp.text();

    const fields = ["token", "url", "c_d", "c_t", "alias"];
    const formData = {};
    for (const field of fields) {
      formData[field] = extractInputValue(field, htmlText);
    }

    const resp2 = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      body: new URLSearchParams(formData).toString()
    });
    const htmlText2 = await resp2.text();

    const ad_form_data = extractInputValue("ad_form_data", htmlText2);
    if (!ad_form_data) {
      return textResponse('Could not extract final ad_form_data.', 500);
    }

    const encodedData = encodeURIComponent(String(ad_form_data));
    const finalWorkerUrl = `https://lively-bird-e78f.conifnun.workers.dev/?url=${urlString.origin}/links/go&ad_form_data=${encodedData}`;

    return textResponse(finalWorkerUrl);

  } catch (error) {
    return textResponse(`An error occurred during the bypass process: ${error.message}`, 500);
  }
}

async function cryptobullo(urlString) {
  const apiUrl = urlString.replace(
    "https://cryptobullo.com/s/",
    "https://cryptobullo.com/api/visit/"
  );

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      referer: "",
      clientGeoData: { timezone: "Asia/Calcutta", locale: "en-US", languages: ["en-US"] }
    })
  });

  const data = await resp.json();
  const originalUrl = data.linkData?.originalUrl || "not found";

  return textResponse(originalUrl);
}


async function eco(url) {
  return textResponse(url);
}

function handleNotFound(url) {
  return textResponse(url, 404);
}

const domainHandlers = {
  'api.example.com': handleApiDomain,
  'status.example.com': handleStatusDomain,
  'tpi.li': tpi,
  'cryptobullo.com': cryptobullo,
  'get2short.com': eco,
  'oii.la': tpi,
  'v2links.org':eco,
  'linksconsole.com':linksconsole,
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (request.method !== 'GET') {
      return textResponse('Method Not Allowed', 405);
    }

    const url = new URL(request.url);
    const rawUrl = url.searchParams.get("url");

    if (!rawUrl) {
      return textResponse('Missing "url" query parameter.', 400);
    }

    let adUrl;
    try {
      adUrl = new URL(rawUrl);
    } catch {
      return textResponse('Invalid "url" query parameter.', 400);
    }

    const hostname = adUrl.hostname;
    const handler = domainHandlers[hostname] || handleNotFound;

    try {
      if (handler === tpi || handler === cryptobullo) {
        return await handler(adUrl.href);
      }
      return await handler(adUrl);
    } catch (error) {
      return textResponse('An internal server error occurred.', 500);
    }
  },
};

function handleOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
