import type { AiConfig, AiProvider } from '@/lib/ai/config';
import { aiConfigured, modelForProvider, normalizeCompatibleBaseUrl } from '@/lib/ai/config';
import { isTauri } from '@/lib/vaultClient';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  /** Vault-relative paths explicitly tagged for this message. */
  attachments?: string[];
};

async function invokeChat(
  config: AiConfig,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<string>('ai_chat', {
    provider: config.provider,
    apiKey: config.apiKey,
    model: modelForProvider(config),
    system,
    messages,
    baseUrl: normalizeCompatibleBaseUrl(config.compatibleBaseUrl)
  });
}

async function fetchChat(config: AiConfig, system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      apiKey: config.apiKey,
      model: modelForProvider(config),
      system,
      messages,
      baseUrl: normalizeCompatibleBaseUrl(config.compatibleBaseUrl)
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return (data as { content: string }).content;
}

export async function sendAiChat(
  config: AiConfig,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  if (!aiConfigured(config)) {
    throw new Error(
      config.provider === 'openai-compatible'
        ? 'Set a local endpoint in Settings → AI (Ollama / LM Studio).'
        : 'Add an API key in Settings → AI to use chat.'
    );
  }
  if (config.provider === 'openai-compatible' && !modelForProvider(config).trim()) {
    throw new Error('Pick a local model in Settings → AI.');
  }
  if (isTauri()) return invokeChat(config, system, messages);
  return fetchChat(config, system, messages);
}

export type { AiProvider };
