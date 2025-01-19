import { Editor } from "./Editor";
import { Runner } from "./Runner";
import { useCallback, useState } from "react";
import { VizFiles } from "@vizhub/viz-types";
import doc from "./exampleContent.md?raw";
import "./App.css";

// export type VizFileId = string;
// export type VizFiles = {
//     [fileId: VizFileId]: VizFile;
// };
// export type VizFile = {
//     name: string;
//     text: string;
// };
// export declare const generateVizFileId: () => VizFileId;

export const App = () => {
  const [vizFiles, setVizFiles] = useState<VizFiles>({});

  const onCodeChange = useCallback((vizFiles: VizFiles) => {
    setVizFiles(vizFiles);
  }, []);

  return (
    <div className="app">
      <div className="app-side">
        <Editor doc={doc} onCodeChange={onCodeChange} />
      </div>
      <div className="app-side">
        <Runner vizFiles={vizFiles} />
      </div>
    </div>
  );
};
