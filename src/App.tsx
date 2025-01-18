import { Editor } from "./Editor";
import { Runner } from "./Runner";
import "./App.css";

export const App = () => {
  return (
    <div className="app">
      <div className="app-side">
        <Editor />
      </div>
      <div className="app-side">
        <Runner />
      </div>
    </div>
  );
};
