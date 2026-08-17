'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAiModels, type AiModelOption } from '@/lib/ai/models';
import type { AiProvider } from '@/lib/ai/config';

export default function AiModelSelect({
  provider,
  apiKey,
  value,
  onChange
}: {
  provider: Exclude<AiProvider, 'off'>;
  apiKey: string;
  value: string;
  onChange: (modelId: string) => void;
}) {
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!apiKey.trim()) {
      setModels([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAiModels(provider, apiKey);
      setModels(list);
      if (list.length > 0 && !list.some((m) => m.id === value)) {
        onChange(list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load models');
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey, value, onChange]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  const hasKey = apiKey.trim().length > 0;
  const disabled = !hasKey || loading || (models.length === 0 && !error);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted disabled:opacity-50"
        >
          {!hasKey ? (
            <option value={value}>Enter API key to load models</option>
          ) : loading ? (
            <option value={value}>Loading models…</option>
          ) : models.length === 0 ? (
            <option value={value}>{value || 'No models found'}</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label === m.id ? m.id : `${m.label} (${m.id})`}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={load}
          disabled={!hasKey || loading}
          title="Refresh models"
          className="shrink-0 rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text hover:border-muted disabled:opacity-50"
        >
          ↻
        </button>
      </div>
      {error && <p className="text-[11px] text-amber">{error}</p>}
    </div>
  );
}
