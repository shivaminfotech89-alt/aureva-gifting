import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Take the splash overlay down now that React owns the page, rather than
// waiting on window 'load' (which blocks on remote fonts and images).
window.__hideLoader?.();
