import { NextRequest, NextResponse } from 'next/server';
import { assertSafeCompatibleBaseUrl } from '@/lib/ai/urlSafety';

type ChatMessage = { role: string; content: string };

async function anthropicChat(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(err);
  }
  const blocks = (data as { content?: { type: string; text?: string }[] }).content ?? [];
  return blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text!)
    .join('');
}

async function openaiCompatibleChat(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  baseUrl: string
): Promise<string> {
  const root = assertSafeCompatibleBaseUrl(baseUrl);
  if (!model.trim()) throw new Error('Model is required');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;

  const res = await fetch(`${root}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'system', content: system }, ...messages]
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(err);
  }
  return (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body?.provider as string;
    const apiKey = (body?.apiKey as string) ?? '';
    const model = body?.model as string;
    const system = body?.system as string;
    const messages = (body?.messages ?? []) as ChatMessage[];
    const baseUrl = (body?.baseUrl as string) ?? '';

    if (!provider || provider === 'off') {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 400 });
    }
    if (provider !== 'openai-compatible' && !apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    if (!system || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let content: string | null = null;
    if (provider === 'anthropic') {
      content = await anthropicChat(apiKey, model, system, messages);
    } else if (provider === 'openai') {
      content = await openaiCompatibleChat(apiKey, model, system, messages, 'https://api.openai.com/v1');
    } else if (provider === 'openai-compatible') {
      content = await openaiCompatibleChat(
        apiKey,
        model,
        system,
        messages,
        assertSafeCompatibleBaseUrl(baseUrl)
      );
    }

    if (content === null) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
