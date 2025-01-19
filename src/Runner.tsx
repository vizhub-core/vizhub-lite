import { useEffect, useState } from "react";
import { VizFiles } from "@vizhub/viz-types";
import "./Runner.css";

export const Runner = ({ vizFiles }: { vizFiles: VizFiles }) => {
  const [swReady, setSwReady] = useState(false);

  console.log(vizFiles);

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
        <iframe
          src={iframeSrc}
          title="Runner iframe"
          style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
        />
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
