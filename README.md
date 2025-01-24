# vizhub-lite

![image](https://github.com/user-attachments/assets/bd83507f-4e29-497d-8ef5-df3f774d7102)

An editing environment for Markdown with embedded code files, where you can run the code while you edit. Supports vanilla HTML & JS.

Try it: https://vizhub-core.github.io/vizhub-lite/

(Ctrl+S to run the code)

## Core Idea

This repo aims to be a place of experimentation (for now) in terms of what's required to set up a minimal integrated development environment for "Vizzes", the executable unit of code for VizHub, featuring both a code editor and a runtime environment. The plan is to create a two-pane application with the editor on the left and the running viz on the right, but without anything super fancy. The editor will be an instance of CodeMirror 6 with the interactive widgets and syntax highlighting theme from [VZCode](https://github.com/vizhub-core/vzcode). There will only be one file being edited, namely a Markdown file that contains embedded definitions for multiple code files using the "bold format" from [llm-code-format](https://github.com/curran/llm-code-format). Those files will then be instantiated within a new version of the VizHub runtime environment, v4, based on ESM and [unidirectional-data-flow](https://www.npmjs.com/package/unidirectional-data-flow).

## App Stack

Based on React + TypeScript + Vite.
