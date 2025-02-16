import { Editor, EditorHandle } from "./Editor";
import { Runner } from "./Runner";
import { useCallback, useState, useRef } from "react";
import { Button } from "./Button";
import { generateVizFileId, VizFiles } from "@vizhub/viz-types";
import { parseMarkdownFiles, serializeMarkdownFiles } from "llm-code-format";
import doc from "./exampleContent.md?raw";
import "./App.css";

export const App = () => {
  const [vizFiles, setVizFiles] = useState<VizFiles>({});
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const editorRef = useRef<EditorHandle>(null);

  const runContent = useCallback((content: string) => {
    const { files } = parseMarkdownFiles(content);
    const vizFiles: VizFiles = files.reduce((acc, file) => {
      const id = generateVizFileId();
      acc[id] = { name: file.name, text: file.text };
      return acc;
    }, {} as VizFiles);
    setVizFiles(vizFiles);
  }, []);

  const onCopyClicked = useCallback(async () => {
    const content = editorRef.current?.getContent();
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopyButtonText("Copied!");
      setTimeout(() => setCopyButtonText("Copy"), 2000);
    }
  }, []);

  const onPasteClicked = useCallback(async () => {
    const clipboardText = await navigator.clipboard.readText();
    const currentContent = editorRef.current?.getContent() || "";
    const content = currentContent + "\n\n" + clipboardText;
    editorRef.current?.setContent(content);

    runContent(content || "");
  }, []);

  const onConsolidateClicked = useCallback(() => {
    const consolidated = serializeMarkdownFiles(Object.values(vizFiles));
    editorRef.current?.setContent(consolidated);
  }, [vizFiles]);

  return (
    <div className="app">
      <div className="app-side">
        <div className="button-row">
          <Button onClick={onCopyClicked}>{copyButtonText}</Button>
          <Button onClick={onPasteClicked}>Paste</Button>
          <Button onClick={onConsolidateClicked}>Consolidate</Button>
        </div>
        <Editor ref={editorRef} doc={doc} runContent={runContent} />
      </div>
      <div className="app-side">
        <Runner vizFiles={vizFiles} />
      </div>
    </div>
  );
};
