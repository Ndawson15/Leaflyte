import { readLocal, writeLocal } from '@/lib/storage';

export type AiProvider = 'off' | 'anthropic' | 'openai' | 'openai-compatible';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  anthropicModel: string;
  openaiModel: string;
  /** Model id for OpenAI-compatible / Ollama / LM Studio. */
  compatibleModel: string;
  /** Base URL including /v1, e.g. http://localhost:11434/v1 */
  compatibleBaseUrl: string;
  allowEdits: boolean;
}

export const AI_STORAGE_KEY = 'leaflyte.ai';

/** API keys are persisted via localStorage only — never written to repo files or .env. */

export const AI_PROVIDERS: { id: AiProvider; name: string; description: string }[] = [
  { id: 'off', name: 'Off', description: 'AI chat disabled' },
  {
    id: 'openai-compatible',
    name: 'Local / OpenAI-compatible',
    description: 'Ollama, LM Studio, or any /v1 endpoint'
  },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models (cloud)' },
  { id: 'openai', name: 'OpenAI', description: 'ChatGPT models (cloud)' }
];

export const LOCAL_ENDPOINT_PRESETS: { id: string; label: string; baseUrl: string }[] = [
  { id: 'ollama', label: 'Ollama', baseUrl: 'http://localhost:11434/v1' },
  { id: 'lmstudio', label: 'LM Studio', baseUrl: 'http://localhost:1234/v1' },
  { id: 'custom', label: 'Custom', baseUrl: '' }
];

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'off',
  apiKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',
  openaiModel: 'gpt-4o-mini',
  compatibleModel: '',
  compatibleBaseUrl: 'http://localhost:11434/v1',
  allowEdits: true
};

export function loadAiConfig(): AiConfig {
  try {
    const raw = readLocal(AI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    return {
      provider: parsed.provider ?? DEFAULT_AI_CONFIG.provider,
      apiKey: parsed.apiKey ?? '',
      anthropicModel: parsed.anthropicModel ?? DEFAULT_AI_CONFIG.anthropicModel,
      openaiModel: parsed.openaiModel ?? DEFAULT_AI_CONFIG.openaiModel,
      compatibleModel: parsed.compatibleModel ?? DEFAULT_AI_CONFIG.compatibleModel,
      compatibleBaseUrl: parsed.compatibleBaseUrl ?? DEFAULT_AI_CONFIG.compatibleBaseUrl,
      allowEdits: parsed.allowEdits ?? DEFAULT_AI_CONFIG.allowEdits
    };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAiConfig(config: AiConfig) {
  writeLocal(AI_STORAGE_KEY, JSON.stringify(config));
}

export function aiConfigured(config: AiConfig): boolean {
  if (config.provider === 'off') return false;
  if (config.provider === 'openai-compatible') {
    return config.compatibleBaseUrl.trim().length > 0;
  }
  return config.apiKey.trim().length > 0;
}

export function modelForProvider(config: AiConfig): string {
  if (config.provider === 'anthropic') return config.anthropicModel;
  if (config.provider === 'openai-compatible') return config.compatibleModel;
  return config.openaiModel;
}

export function normalizeCompatibleBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}
