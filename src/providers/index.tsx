import { BrowserRouter } from 'react-router-dom';
import '@/i18n/config';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage/KnowledgeBasePage';
import { KnowledgeStoreProvider } from '@/stores/KnowledgeBaseStore';
import { AppRouter } from './router/AppRouter';

export interface KnowledgeBaseRootProps {
  basename?: string;
}

export function KnowledgeBaseMfeRoot() {
  return (
    <KnowledgeStoreProvider>
      <KnowledgeBasePage />
    </KnowledgeStoreProvider>
  );
}

export function KnowledgeBaseRoot({ basename = '' }: KnowledgeBaseRootProps) {
  return (
    <BrowserRouter basename={basename}>
      <KnowledgeStoreProvider>
        <AppRouter />
      </KnowledgeStoreProvider>
    </BrowserRouter>
  );
}
