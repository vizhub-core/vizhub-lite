import { Editor } from "./Editor";
import { Runner } from "./Runner";
import "./App.css";
import { useCallback } from "react";

export const App = () => {
  const handleCodeChange = useCallback(
    (files: { name: string; text: string }[]) => {
      console.log(files);
    },
    []
  );
  return (
    <div className="app">
      <div className="app-side">
        <Editor onCodeChange={handleCodeChange} />
      </div>
      <div className="app-side">
        <Runner />
      </div>
    </div>
  );
};
