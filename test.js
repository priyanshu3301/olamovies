const url1 = "https://srnky.com/DvV2x3TD0l6m";
const url2 = "https://loanbixby.com"
const url3 = "https://srnky.com/links/go";

const headers = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36"
};

async function main() {
    try {
        // 1. GET request
        const getResponse = await fetch(url1, {
            headers
        });

        const html = await getResponse.text();

        if (!getResponse.ok) {
            throw new Error(`GET failed: ${getResponse.status}`);
        }

        // 2. Extract hidden input fields
        const formData = new URLSearchParams();

        const inputRegex =
            /<input\b[^>]*type=["']hidden["'][^>]*>/gi;

        const inputs = html.match(inputRegex) || [];

        for (const input of inputs) {
            const nameMatch = input.match(
                /\bname=["']([^"']*)["']/i
            );

            if (!nameMatch) continue;

            const valueMatch = input.match(
                /\bvalue=["']([^"']*)["']/i
            );

            const name = nameMatch[1];
            const value = valueMatch ? valueMatch[1] : "";

            formData.append(name, value);
        }

        console.log("Extracted values:");
        console.log(Object.fromEntries(formData));

        // 3. POST extracted values
        const postUrl = url1

        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type":
                    "application/x-www-form-urlencoded",
                "Referer": url2
            },
            body: formData
        });

        const postHtml = await postResponse.text();

        if (!postResponse.ok) {
            throw new Error(`POST failed: ${postResponse.status}`);
        }

        // 4. Extract ad_form_data
        let adFormData = null;

        // Try input
        let match = postHtml.match(
            /<input\b[^>]*name=["']ad_form_data["'][^>]*value=["']([^"']*)["']/i
        );

        if (match) {
            adFormData = match[1];
        }

        // Try textarea
        if (!adFormData) {
            match = postHtml.match(
                /<textarea\b[^>]*name=["']ad_form_data["'][^>]*>([\s\S]*?)<\/textarea>/i
            );

            if (match) {
                adFormData = match[1].trim();
            }
        }

        if (!adFormData) {
            throw new Error("ad_form_data not found");
        }

        console.log("\nad_form_data:");
        console.log(adFormData);

        // 5. Wait 5 seconds
        console.log("\nWaiting 5 seconds...");

        await new Promise(resolve =>
            setTimeout(resolve, 20000)
        );


        const finalForm = new URLSearchParams();

        finalForm.append("_method", "POST");
        finalForm.append("ad_form_data", adFormData);

        const response = await fetch(url3, {
            method: "POST",

            credentials: "include",

            headers: {
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },

            body: finalForm.toString()
        });

        console.log("Status:", response.status);
        console.log("Response:", await response.text());

    } catch (error) {
        console.error("\nError:", error.message);
    }
}

main();