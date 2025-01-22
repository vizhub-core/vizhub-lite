// We'll store: fileId -> { name, text } exactly as we receive it
let VIZ_FILES = {};

// A small helper inside the worker to guess content type
function guessContentType(fileName) {
  if (fileName.endsWith(".html")) return "text/html";
  if (fileName.endsWith(".js")) return "text/javascript";
  if (fileName.endsWith(".css")) return "text/css";
  if (fileName.endsWith(".csv")) return "text/csv";
  return "text/plain";
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Receive the VizFiles object directly from the app
// Example shape of payload:
//
// {
//   "234": { name: "index.html", text: "<!DOCTYPE html>..." },
//   "567": { name: "index.js",   text: "import ..."        },
//   ...
// }
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VIZ_FILES") {
    VIZ_FILES = event.data.payload || {};
    // Send acknowledgment back to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "VIZ_FILES_RECEIVED",
        });
      });
    });
  }
  // Add handling for claiming clients
  else if (event.data && event.data.type === "CLAIM_CLIENTS") {
    self.clients.claim();
  }
});

// For each fetch, we want to match the requested path (e.g. /index.html)
// to whichever file in VIZ_FILES has .name === "index.html".
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept same-origin requests
  if (url.origin === self.location.origin) {
    // e.g. /index.html => "index.html"
    const path = url.pathname.replace(/^\//, "");

    // Find a file in VIZ_FILES whose .name matches path
    const fileId = Object.keys(VIZ_FILES).find((fid) => {
      return VIZ_FILES[fid].name === path;
    });

    if (fileId) {
      const { name, text } = VIZ_FILES[fileId];
      const contentType = guessContentType(name);

      event.respondWith(
        new Response(text, {
          status: 200,
          headers: { "Content-Type": contentType },
        })
      );
      return;
    }
  }

  // Otherwise, go to the network
});
