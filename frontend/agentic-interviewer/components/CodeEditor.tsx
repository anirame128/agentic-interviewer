"use client";

import React from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: OnMount;
  language?: string;
}

export default function CodeEditor({ value, onChange, onMount, language = "typescript" }: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      onMount={onMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 16,
        fontFamily: "Fira Mono, monospace",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        roundedSelection: false,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        renderLineHighlight: "all",
        readOnly: false,
        cursorStyle: "line",
        cursorBlinking: "smooth",
        cursorWidth: 2,
        lineHeight: 24,
        padding: {
          top: 16,
          bottom: 16,
        },
      }}
    />
  );
}
