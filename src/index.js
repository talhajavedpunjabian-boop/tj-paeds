// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline + installable PWA
serviceWorkerRegistration.register({
  onSuccess: () => console.log('[TJ Paeds] App ready for offline use'),
  onUpdate: (registration) => {
    // Optionally auto-apply update
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  },
});

// Report web vitals (optional — remove if not needed)
reportWebVitals();
