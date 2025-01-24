import { useEffect, useState, useRef } from "react";
import { VizFiles } from "@vizhub/viz-types";
import "./Runner.css";

export const Runner = ({ vizFiles }: { vizFiles: VizFiles }) => {
  const [swReady, setSwReady] = useState(false);
  const [filesReceived, setFilesReceived] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Keep a ref to the active service worker
  const swRef = useRef<ServiceWorker | null>(null);

  // 1) Register the service worker once
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./service-worker.js", { scope: "./" })
        .then(async (registration) => {
          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;

          // Store reference to whichever is available
          if (navigator.serviceWorker.controller) {
            swRef.current = navigator.serviceWorker.controller;
          } else if (registration.active) {
            swRef.current = registration.active;
            // Force the active service worker to take control
            registration.active.postMessage({ type: "CLAIM_CLIENTS" });
          }

          if (swRef.current) {
            setSwReady(true);
          } else {
            console.warn("Unable to find attached Service Worker!");
          }
        })
        .catch(console.error);
    }
  }, []);

  // Listen for acknowledgment from service worker
  useEffect(() => {
    // Wait for the service worker to be ready
    if (!swReady) return;

    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === "VIZ_FILES_RECEIVED") {
        setFilesReceived(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", messageHandler);
    };
  }, [swReady]);

  // 2) Whenever vizFiles changes & SW is ready,
  // post them to the SW
  useEffect(() => {
    if (!swReady) return;

    if (swRef.current) {
      // Reset filesReceived when sending new files
      setFilesReceived(false);

      swRef.current.postMessage({
        type: "SET_VIZ_FILES",
        payload: vizFiles,
      });
    } else {
      console.warn("No service worker reference available");
    }

    // Bump the iframe key to force a re-render
    setIframeKey((prev) => prev + 1);
  }, [vizFiles, swReady]);

  // 3) Check if we have a file named "index.html" among the entries
  const allVizFileIds = Object.keys(vizFiles);
  const hasIndexHtml = allVizFileIds.some(
    (fileId) => vizFiles[fileId].name === "index.html"
  );

  // We'll load /index.html if it exists
  const iframeSrc = hasIndexHtml ? "/index.html" : undefined;

  // Wait for initialization of the service worker,
  // otherwise the iframe will render what the server actually serves.
  const shouldRenderIframe = swReady && iframeSrc && filesReceived;

  return (
    <div className="runner">
      {shouldRenderIframe ? <iframe key={iframeKey} src={iframeSrc} /> : null}
    </div>
  );
};
