import {
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { EditorView, basicSetup } from "codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { LanguageDescription, LanguageSupport } from "@codemirror/language";
import { parser as htmlParser } from "@lezer/html";
import { parser as jsParser } from "@lezer/javascript";
import { parseMixed } from "@lezer/common";
import { LRLanguage } from "@codemirror/language";
import { css } from "@codemirror/lang-css";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { vizhubTheme } from "@vizhub/codemirror-theme";
import "./Editor.css";

const mixedHTMLParser = htmlParser.configure({
  wrap: parseMixed((node) => {
    return node.name == "ScriptText" ? { parser: jsParser } : null;
  }),
});

// Support for mixed HTML and JavaScript
// within Markdown HTML code fences
const mixedHTML = LRLanguage.define({ parser: mixedHTMLParser });
const mixedHTMLSupport = new LanguageSupport(mixedHTML);

// Define the supported code languages
// for Markdown code fences
const codeLanguages = [
  LanguageDescription.of({
    name: "JavaScript",
    alias: ["js", "javascript"],
    extensions: ["js"],
    support: javascript(),
  }),
  LanguageDescription.of({
    name: "HTML",
    extensions: ["html"],
    support: mixedHTMLSupport,
  }),
  LanguageDescription.of({
    name: "CSS",
    extensions: ["css"],
    support: css(),
  }),
  LanguageDescription.of({
    name: "Markdown",
    alias: ["md", "markdown"],
    extensions: ["md"],
    support: markdown({ base: markdownLanguage }),
  }),
];

export interface EditorHandle {
  setContent: (content: string) => void;
  getContent: () => string | undefined;
}

export const Editor = forwardRef<
  EditorHandle,
  {
    doc: string;
    runContent: (content: string) => void;
  }
>(({ doc, runContent }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: content,
          },
        });
      }
    },
    getContent: () => {
      return editorViewRef.current?.state.doc.toString();
    },
  }));

  // Set up the CodeMirror editor
  useEffect(() => {
    // Handle first run
    runContent(doc);

    // Get latest content from CodeMirror and run it
    const run = (view: EditorView) => {
      const content: string = view.state.doc.toString();
      runContent(content);
      return true;
    };

    // Set up keymap for running the code
    // 'Mod' represents 'trl' on Windows/Linux and 'Cmd' on macOS
    const customKeymap = keymap.of([
      { key: "Mod-s", run },
      { key: "Mod-Enter", run },
      { key: "Shift-Enter", run },
    ]);

    // Apply the keymap with high precedence
    // The "Mod-Enter" won't work without this
    const highPrecedenceKeymap = Prec.high(customKeymap);

    // Create the CodeMirror editor
    const editor = new EditorView({
      doc,
      extensions: [
        basicSetup,
        // Enable line wrapping
        EditorView.lineWrapping,
        // Support nested languages
        // in Markdown code fences
        markdown({
          codeLanguages,
          defaultCodeLanguage: javascript(),
        }),

        // Apply the custom keymap for running the code
        // (Ctrl + S, Ctrl + Enter, Shift + Enter)
        highPrecedenceKeymap,

        vizhubTheme,
      ],
      parent: divRef.current!,
    });

    // Clean up the editor on unmount
    editorViewRef.current = editor;

    return () => {
      editorViewRef.current = null;
      editor.destroy();
    };
  }, []);

  return <div ref={divRef} className="editor" />;
});
