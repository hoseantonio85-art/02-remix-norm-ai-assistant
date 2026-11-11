import { Navigate, Route, Routes } from 'react-router-dom';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage/KnowledgeBasePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path='/knowledge-base' element={<KnowledgeBasePage />} />
      <Route path='/' element={<Navigate to='/knowledge-base' replace />} />
      <Route path='*' element={<Navigate to='/knowledge-base' replace />} />
    </Routes>
  );
}
