import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocalProductShell } from './components/LocalProductShell/LocalProductShell';
import { KnowledgeBaseRoot } from './providers';
import '@sber-orm/ui-kit/index.css';
import '@sber-orm/components/index.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocalProductShell>
      <KnowledgeBaseRoot
        basename={import.meta.env.BASE_URL.replace(/\/$/, '')}
      />
    </LocalProductShell>
  </React.StrictMode>,
);
