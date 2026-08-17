import { NextRequest, NextResponse } from 'next/server';

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

async function openaiChat(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
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
    const apiKey = body?.apiKey as string;
    const model = body?.model as string;
    const system = body?.system as string;
    const messages = (body?.messages ?? []) as ChatMessage[];

    if (!provider || provider === 'off') {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 400 });
    }
    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    if (!system || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const content =
      provider === 'anthropic'
        ? await anthropicChat(apiKey, model, system, messages)
        : provider === 'openai'
          ? await openaiChat(apiKey, model, system, messages)
          : null;

    if (content === null) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
