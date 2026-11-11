import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type KnowledgeDataset,
  type KnowledgeService,
  localKnowledgeService,
} from '@/services/knowledgeService';

type KnowledgeState =
  | { status: 'loading'; dataset: null; error: null }
  | { status: 'ready'; dataset: KnowledgeDataset; error: null }
  | { status: 'error'; dataset: null; error: Error };

type KnowledgeStoreValue = KnowledgeState & { reload(): void };

const KnowledgeStoreContext = createContext<KnowledgeStoreValue | null>(null);

export function KnowledgeStoreProvider({
  children,
  service = localKnowledgeService,
}: PropsWithChildren<{ service?: KnowledgeService }>) {
  const [request, setRequest] = useState(0);
  const [state, setState] = useState<KnowledgeState>({
    status: 'loading',
    dataset: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', dataset: null, error: null });
    service.loadCompanyKnowledge().then(
      (dataset) =>
        active && setState({ status: 'ready', dataset, error: null }),
      (reason: unknown) => {
        if (!active) {
          return;
        }
        const error =
          reason instanceof Error ? reason : new Error(String(reason));
        setState({ status: 'error', dataset: null, error });
      },
    );
    return () => {
      active = false;
    };
  }, [service, request]);

  const reload = useCallback(() => setRequest((value) => value + 1), []);
  const value = useMemo(() => ({ ...state, reload }), [state, reload]);

  return (
    <KnowledgeStoreContext.Provider value={value}>
      {children}
    </KnowledgeStoreContext.Provider>
  );
}

export function useKnowledgeStore(): KnowledgeStoreValue {
  const value = useContext(KnowledgeStoreContext);
  if (!value) {
    throw new Error(
      'useKnowledgeStore must be used inside KnowledgeStoreProvider',
    );
  }
  return value;
}
