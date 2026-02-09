import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Highlight.jsのスタイルと本体をインポートしてグローバルに登録
// これにより、既存のNotepadなどのツールが window.hljs を参照しても動くようになります
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
(window as any).hljs = hljs;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);