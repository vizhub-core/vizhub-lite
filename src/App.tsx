import { Editor, EditorHandle } from "./Editor";
import { Runner } from "./Runner";
import { useCallback, useState, useRef } from "react";
import { format } from "d3-format";
import { Button } from "./Button";
import { generateVizFileId, VizFiles } from "@vizhub/viz-types";
import { parseMarkdownFiles, serializeMarkdownFiles } from "llm-code-format";
import llamaTokenizer from "llama-tokenizer-js";
import doc from "./exampleContent.md?raw";
import "./App.css";

export const App = () => {
  const [vizFiles, setVizFiles] = useState<VizFiles>({});
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [tokenCount, setTokenCount] = useState(0);
  const editorRef = useRef<EditorHandle>(null);

  const runContent = useCallback((content: string) => {
    setTokenCount(llamaTokenizer.encode(content).length);
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
    const content = serializeMarkdownFiles(Object.values(vizFiles));
    runContent(content || "");
    editorRef.current?.setContent(content);
  }, [vizFiles]);

  const onPasteAndConsolidateClicked = useCallback(async () => {
    // First paste
    const clipboardText = await navigator.clipboard.readText();
    const currentContent = editorRef.current?.getContent() || "";
    const newContent = currentContent + "\n\n" + clipboardText;

    // Then consolidate
    const consolidated = serializeMarkdownFiles(Object.values(vizFiles));
    editorRef.current?.setContent(consolidated);

    // Then run
    runContent(newContent);
    runContent(consolidated || "");
  }, [vizFiles]);

  // TODO make this convert to files and download a .zip
  const onDownloadClicked = useCallback(() => {
    const content = editorRef.current?.getContent();
    if (content) {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "content.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  return (
    <div className="app">
      <div className="app-side">
        <div className="button-row">
          <Button onClick={onCopyClicked}>{copyButtonText}</Button>
          <Button onClick={onPasteClicked}>Paste</Button>
          <Button onClick={onConsolidateClicked}>Consolidate</Button>
          <Button onClick={onPasteAndConsolidateClicked}>
            Paste & Consolidate
          </Button>
          <Button onClick={onDownloadClicked}>Download</Button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "10px",
              fontFamily: "sans-serif",
              fontSize: "14px",
            }}
          >
            {format(",")(tokenCount)} tokens
          </span>
        </div>
        <Editor ref={editorRef} doc={doc} runContent={runContent} />
      </div>
      <div className="app-side">
        <Runner vizFiles={vizFiles} />
      </div>
    </div>
  );
};
