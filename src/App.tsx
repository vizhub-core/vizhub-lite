import { Editor, EditorHandle } from "./Editor";
import { Runner } from "./Runner";
import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { VizFiles } from "@vizhub/viz-types";
import { serializeMarkdownFiles } from "llm-code-format";
import doc from "./exampleContent.md?raw";
import "./App.css";

export const App = () => {
  const [vizFiles, setVizFiles] = useState<VizFiles>({});
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const editorRef = useRef<EditorHandle>(null);

  const onCodeChange = useCallback((vizFiles: VizFiles) => {
    setVizFiles(vizFiles);
  }, []);

  const onConsolidateClicked = useCallback(() => {
    const consolidated = serializeMarkdownFiles(Object.values(vizFiles));
    editorRef.current?.setContent(consolidated);
  }, [vizFiles]);

  return (
    <div className="app">
      <div className="app-side">
        <div className="button-row">
          <Button
            onClick={async () => {
              const content = editorRef.current?.getContent();
              if (content) {
                await navigator.clipboard.writeText(content);
                setCopyButtonText("Copied!");
                setTimeout(() => setCopyButtonText("Copy"), 2000);
              }
            }}
          >
            {copyButtonText}
          </Button>
          <Button onClick={() => console.log("Paste clicked")}>Paste</Button>
          <Button onClick={onConsolidateClicked}>Consolidate</Button>
        </div>
        <Editor ref={editorRef} doc={doc} onCodeChange={onCodeChange} />
      </div>
      <div className="app-side">
        <Runner vizFiles={vizFiles} />
      </div>
    </div>
  );
};
