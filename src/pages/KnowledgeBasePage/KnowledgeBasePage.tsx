import { Button, Text } from '@sber-orm/ui-kit';
import { useTranslation } from 'react-i18next';
import KnowledgeBase from '@/components/KnowledgeBase';
import { useKnowledgeStore } from '@/stores/KnowledgeBaseStore';
import styles from './KnowledgeBasePage.module.scss';

export default function KnowledgeBasePage() {
  const { t } = useTranslation();
  const state = useKnowledgeStore();

  if (state.status === 'loading') {
    return (
      <main className={styles.state} aria-busy='true'>
        {t('loading')}
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className={styles.state} role='alert'>
        <Text size='lg'>{t('errorTitle')}</Text>
        <Button variant='primary' size='S' onClick={state.reload}>
          {t('retry')}
        </Button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <KnowledgeBase dataset={state.dataset} />
    </main>
  );
}
