import { readLocal, writeLocal } from '@/lib/storage';

export type AiProvider = 'off' | 'anthropic' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  anthropicModel: string;
  openaiModel: string;
  allowEdits: boolean;
}

export const AI_STORAGE_KEY = 'leaflyte.ai';

/** API keys are persisted via localStorage only — never written to repo files or .env. */

export const AI_PROVIDERS: { id: AiProvider; name: string; description: string }[] = [
  { id: 'off', name: 'Off', description: 'AI chat disabled' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models' },
  { id: 'openai', name: 'OpenAI', description: 'ChatGPT models' }
];

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'off',
  apiKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',
  openaiModel: 'gpt-4o-mini',
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
  return config.provider !== 'off' && config.apiKey.trim().length > 0;
}

export function modelForProvider(config: AiConfig): string {
  return config.provider === 'anthropic' ? config.anthropicModel : config.openaiModel;
}
