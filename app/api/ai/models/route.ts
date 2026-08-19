import { NextRequest, NextResponse } from 'next/server';
import { normalizeCompatibleBaseUrl } from '@/lib/ai/config';
import { isOpenAiChatModel, type AiModelOption } from '@/lib/ai/models';

type AnthropicModelsResponse = {
  data?: { id: string; display_name?: string }[];
  has_more?: boolean;
  last_id?: string | null;
};

type OpenAiModelsResponse = {
  data?: { id: string }[];
};

async function anthropicModels(apiKey: string): Promise<AiModelOption[]> {
  const models: AiModelOption[] = [];
  let afterId: string | undefined;

  for (;;) {
    const url = new URL('https://api.anthropic.com/v1/models');
    url.searchParams.set('limit', '100');
    if (afterId) url.searchParams.set('after_id', afterId);

    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    const data = (await res.json().catch(() => ({}))) as AnthropicModelsResponse & {
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message ?? res.statusText);
    }

    for (const m of data.data ?? []) {
      models.push({ id: m.id, label: m.display_name?.trim() || m.id });
    }

    if (!data.has_more || !data.last_id) break;
    afterId = data.last_id;
  }

  return models;
}

async function openaiCompatibleModels(apiKey: string, baseUrl: string): Promise<AiModelOption[]> {
  const root = normalizeCompatibleBaseUrl(baseUrl);
  if (!root) throw new Error('Base URL is required');

  const headers: Record<string, string> = {};
  if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;

  const res = await fetch(`${root}/models`, { headers });
  const data = (await res.json().catch(() => ({}))) as OpenAiModelsResponse & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? res.statusText);
  }

  return (data.data ?? [])
    .map((m) => m.id)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, label: id }));
}

async function openaiModels(apiKey: string): Promise<AiModelOption[]> {
  const models = await openaiCompatibleModels(apiKey, 'https://api.openai.com/v1');
  return models
    .filter((m) => isOpenAiChatModel(m.id))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body?.provider as string;
    const apiKey = (body?.apiKey as string) ?? '';
    const baseUrl = (body?.baseUrl as string) ?? '';

    if (!provider || provider === 'off') {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 400 });
    }
    if (provider !== 'openai-compatible' && !apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const models =
      provider === 'anthropic'
        ? await anthropicModels(apiKey)
        : provider === 'openai'
          ? await openaiModels(apiKey)
          : provider === 'openai-compatible'
            ? await openaiCompatibleModels(apiKey, baseUrl)
            : null;

    if (models === null) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load models';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
