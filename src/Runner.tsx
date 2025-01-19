import { useEffect, useState } from "react";
import { VizFiles } from "@vizhub/viz-types";
import "./Runner.css";

export const Runner = ({ vizFiles }: { vizFiles: VizFiles }) => {
  // Track when the service worker is ready
  const [swReady, setSwReady] = useState(false);

  // A unique key to force the iframe to reload
  const [iframeKey, setIframeKey] = useState(0);

  // 1) Register the service worker once
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
          console.log("SW is active");
          setSwReady(true);
        })
        .catch(console.error);
    }
  }, []);

  // 2) Whenever vizFiles changes & SW is ready,
  // post them to the SW
  useEffect(() => {
    if (!swReady) return;

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SET_VIZ_FILES",
        payload: vizFiles,
      });
    }

    // Bump the iframe key to force a re-render
    // TODO only if hot reloading is not supported
    setIframeKey((prev) => prev + 1);
  }, [vizFiles, swReady]);

  // 3) Check if we have a file named "index.html" among the entries
  const allVizFileIds = Object.keys(vizFiles);
  const hasIndexHtml = allVizFileIds.some(
    (fileId) => vizFiles[fileId].name === "index.html"
  );

  // We'll load /index.html if it exists
  const iframeSrc = hasIndexHtml ? "/index.html" : undefined;

  return (
    <div className="runner">
      {iframeSrc ? (
        <iframe key={iframeKey} src={iframeSrc} />
      ) : (
        <p>
          No file named <code>index.html</code> found in your{" "}
          <code>vizFiles</code>.
        </p>
      )}
    </div>
  );
};

// import { VizFiles } from "@vizhub/viz-types";
// import "./Runner.css";
// export const Runner = ({ vizFiles }: { vizFiles: VizFiles }) => {
//   const srcDoc = "";

//   return (
//     <div className="runner">
//       <iframe srcDoc={srcDoc} />
//     </div>
//   );
// };
