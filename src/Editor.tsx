import { useEffect, useRef } from "react";
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
import { parseMarkdownFiles } from "llm-code-format";
import doc from "./exampleContent.md?raw";
import "./Editor.css";

const mixedHTMLParser = htmlParser.configure({
  wrap: parseMixed((node) => {
    return node.name == "ScriptText" ? { parser: jsParser } : null;
  }),
});

const mixedHTML = LRLanguage.define({ parser: mixedHTMLParser });
const mixedHTMLSupport = new LanguageSupport(mixedHTML);

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

export const Editor = ({
  onCodeChange,
}: {
  onCodeChange: (files: { name: string; text: string }[]) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const run = (view: EditorView) => {
      const content = view.state.doc.toString();
      onCodeChange(parseMarkdownFiles(content).files);
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

    const editor = new EditorView({
      doc,
      extensions: [
        basicSetup,
        markdown({
          codeLanguages,
          defaultCodeLanguage: javascript(),
        }),
        highPrecedenceKeymap,
      ],
      parent: ref.current!,
    });

    return () => {
      editor.destroy();
    };
  }, []);

  return <div ref={ref} className="editor" />;
};
