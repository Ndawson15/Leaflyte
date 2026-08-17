import type { AiConfig } from '@/lib/ai/config';
import { aiConfigured, modelForProvider } from '@/lib/ai/config';
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
    messages
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
      messages
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
    throw new Error('Add an API key in Settings → AI to use chat.');
  }
  if (isTauri()) return invokeChat(config, system, messages);
  return fetchChat(config, system, messages);
}
