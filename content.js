function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.insertBefore(script, node.firstChild); // ← fix for timeskip
}

injectScript(chrome.runtime.getURL('inject.js'), 'head'); // SECOND

window.addEventListener("message", async (event) => {

    if (event.source !== window) {
        return;
    }

    const message = event.data;

    if (!message || message.type !== "PAGE_PROXY_FETCH") {
        return;
    }

    try {

        const response = await chrome.runtime.sendMessage({
            type: "PROXY_FETCH",
            url: message.url,
            options: message.options
        });

        window.postMessage({
            type: "PAGE_PROXY_FETCH_RESULT",
            requestId: message.requestId,
            response
        }, "*");

    } catch (error) {

        window.postMessage({
            type: "PAGE_PROXY_FETCH_RESULT",
            requestId: message.requestId,
            response: {
                success: false,
                error: error.message
            }
        }, "*");
    }
});