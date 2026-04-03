const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
self.basePath = self.basePath || basePath;

self.$scramjet = {
    files: {
        wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
        sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js",
    }
};

importScripts("https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
    prefix: basePath + "scramjet/"
});

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// --------------------
// Blocklist setup
// --------------------
const BLOCKED_DOMAINS = [
    "edulearnschool.vercel.app",
    "educational.cyou",
    "educational.cfd",
    "educational.sbs",
    "xvideos.com",
    "legofornite.com",
    "pornhub.com",
    "edulearn-school.global.ssl.fastly.net",
    "besteducation.global.ssl.fastly.net",
    "global.ssl.fastly.net"
];

const BLOCKED_KEYWORDS = [
    "porn",
    "adult",
    "sex",
    "xxx"
];

// Only block **user-requested URLs**, ignore proxy scripts or Scramjet itself
function isBlocked(url) {
    try {
        const u = new URL(url);

        // Ignore requests to our proxy scripts / service worker paths
        if (u.pathname.startsWith(basePath)) return false;

        // Block forbidden domains
        if (BLOCKED_DOMAINS.includes(u.hostname)) return true;

        // Block forbidden keywords in URL
        const lcUrl = url.toLowerCase();
        return BLOCKED_KEYWORDS.some(keyword => lcUrl.includes(keyword));
    } catch {
        return false; // don't block invalid URLs blindly
    }
}

// --------------------
// Fetch handler
// --------------------
self.addEventListener("fetch", (event) => {
    const url = event.request.url;

    // Apply blocklist only to user requests
    if (isBlocked(url)) {
        console.warn("Blocked request to:", url);
        event.respondWith(new Response("Blocked by service worker", { status: 403 }));
        return;
    }

    event.respondWith((async () => {
        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    })());
});

// --------------------
// Wisp config
// --------------------
let wispConfig = {};
let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

self.addEventListener("message", ({ data }) => {
    if (data.type === "config" && data.wispurl) {
        wispConfig.wispurl = data.wispurl;
        console.log("SW: Received config", wispConfig);
        if (resolveConfigReady) {
            resolveConfigReady();
            resolveConfigReady = null;
        }
    }
});

// Fallback if config is never received
setTimeout(() => {
    if (!wispConfig.wispurl && resolveConfigReady) {
        console.warn("SW: Config timeout, using default Wisp");
        wispConfig.wispurl = "wss://dash.goip.de/wisp/";
        resolveConfigReady();
        resolveConfigReady = null;
    }
}, 1000);

// --------------------
// Scramjet request handler
// --------------------
scramjet.addEventListener("request", async (e) => {
    // Apply blocklist to Scramjet requests too
    if (isBlocked(e.url)) {
        console.warn("Scramjet blocked request to:", e.url);
        e.response = new Response("Blocked by service worker | Stop SK1DDING / G00NING, and go touch some 🌿", { status: 403 });
        return;
    }

    e.response = (async () => {
        if (!scramjet.client) {
            await configReadyPromise;
            if (!wispConfig.wispurl) return new Response("WISP URL missing", { status: 500 });

            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport(
                "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
                [{ wisp: wispConfig.wispurl }]
            );
            scramjet.client = connection;
        }

        const MAX_RETRIES = 2;
        let lastErr;

        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                return await scramjet.client.fetch(e.url, {
                    method: e.method,
                    body: e.body,
                    headers: e.requestHeaders,
                    credentials: "include",
                    mode: e.mode === "cors" ? e.mode : "same-origin",
                    cache: e.cache,
                    redirect: "manual",
                    duplex: "half",
                });
            } catch (err) {
                lastErr = err;
                const errMsg = err.message.toLowerCase();
                const isRetryable = errMsg.includes("connect") ||
                    errMsg.includes("eof") ||
                    errMsg.includes("handshake") ||
                    errMsg.includes("reset");

                if (!isRetryable || i === MAX_RETRIES || e.method !== 'GET') break;

                console.warn(`Scramjet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);
                await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
        }

        console.error("Scramjet Final Fetch Error:", lastErr);
        return new Response("Scramjet Fetch Error: " + lastErr.message, { status: 502 });
    })();
});
