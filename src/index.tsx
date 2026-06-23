import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind and global styles
import App from './App';
import { Provider } from 'react-redux';
import { store } from './app/store';
import reportWebVitals from './reportWebVitals';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // Or your preferred Quill/SyntaxHighlighter theme

// Configure highlight.js languages if needed (usually auto-detects well)
hljs.configure({
  // languages: ['javascript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'xml', 'markdown']
});

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
  );
} else {
  console.error("Fatal error: Root element with ID 'root' not found.");
}


reportWebVitals();