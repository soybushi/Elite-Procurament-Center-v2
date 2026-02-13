import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setActor } from './stores/authStore';
import type { Role } from './core/security/roles';

/* ---- DEV-only bootstrap actor ---- */
if (import.meta.env.DEV) {
  setActor({ userId: 'dev-user', role: 'admin' as Role });
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