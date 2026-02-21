import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setActor } from './stores/authStore';

/* ---- Domain event handlers (self-registering on import) ---- */
import './ledger/ledgerEventHandlers';
import './ledger/prApprovedHandler';

/* ---- DEV-only bootstrap actor ---- */
if (import.meta.env.DEV) {
  setActor({ userId: 'dev-user', role: 'admin', companyId: 'elite-flower' });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
