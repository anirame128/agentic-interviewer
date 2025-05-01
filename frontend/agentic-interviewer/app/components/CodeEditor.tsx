'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  isVisible: boolean;
}

export default function CodeEditor({ isVisible }: CodeEditorProps) {
  const [editorLanguage, setEditorLanguage] = useState('javascript');

  if (!isVisible) return null;

  return (
    <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-white">Code Editor</h3>
        </div>
        <select
          value={editorLanguage}
          onChange={(e) => setEditorLanguage(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <Editor
        height="400px"
        language={editorLanguage}
        defaultValue="// Start coding here..."
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
      />
    </div>
  );
} 