'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  aiConfigured,
  DEFAULT_AI_CONFIG,
  loadAiConfig,
  saveAiConfig,
  type AiConfig
} from '@/lib/ai/config';

interface AiContextValue {
  config: AiConfig;
  setConfig: (next: AiConfig) => void;
  configured: boolean;
}

const AiContext = createContext<AiContextValue | null>(null);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AiConfig>(DEFAULT_AI_CONFIG);

  useEffect(() => {
    setConfigState(loadAiConfig());
  }, []);

  const setConfig = (next: AiConfig) => {
    setConfigState(next);
    saveAiConfig(next);
  };

  const value = useMemo(
    () => ({ config, setConfig, configured: aiConfigured(config) }),
    [config]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within AiProvider');
  return ctx;
}
