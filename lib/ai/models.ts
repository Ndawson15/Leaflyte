import type { AiProvider } from '@/lib/ai/config';
import { normalizeCompatibleBaseUrl } from '@/lib/ai/config';
import { isTauri } from '@/lib/vaultClient';

export type AiModelOption = {
  id: string;
  label: string;
};

function isOpenAiChatModel(id: string): boolean {
  if (/dall-e|whisper|tts|embedding|moderation|davinci|babbage|realtime|transcribe|audio|search|sora|codex/i.test(id)) {
    return false;
  }
  return /^(gpt-|o[0-9]|chatgpt-)/.test(id);
}

async function invokeModels(
  provider: AiProvider,
  apiKey: string,
  baseUrl?: string
): Promise<AiModelOption[]> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AiModelOption[]>('list_ai_models', {
    provider,
    apiKey,
    baseUrl: baseUrl ?? ''
  });
}

async function fetchModels(
  provider: AiProvider,
  apiKey: string,
  baseUrl?: string
): Promise<AiModelOption[]> {
  const res = await fetch('/api/ai/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey, baseUrl })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return (data as { models: AiModelOption[] }).models;
}

export async function fetchAiModels(
  provider: Exclude<AiProvider, 'off'>,
  apiKey: string,
  baseUrl?: string
): Promise<AiModelOption[]> {
  if (provider !== 'openai-compatible' && !apiKey.trim()) return [];
  if (provider === 'openai-compatible' && !normalizeCompatibleBaseUrl(baseUrl ?? '')) return [];
  const normalized = normalizeCompatibleBaseUrl(baseUrl ?? '');
  if (isTauri()) return invokeModels(provider, apiKey, normalized);
  return fetchModels(provider, apiKey, normalized);
}

export { isOpenAiChatModel };
