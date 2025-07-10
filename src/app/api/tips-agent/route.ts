// app/api/tips-agent/route.ts
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { triggers: string[] };
const triggers = body.triggers;


    if (!Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json({ error: 'No triggers provided.' }, { status: 400 });
    }

    const prompt = `You are a friendly wellbeing coach. The user is experiencing stress due to: ${triggers.join(", ")}.
Suggest 3 short and practical tips or techniques that can help them manage or reduce this stress.

Format your answer as a list.`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = chat.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('No response from OpenAI.');

    const tips = text.split(/\n+|\d+\.\s*/).filter(Boolean);

    return NextResponse.json({ tips });
  } catch (err: unknown) {
  const error = err instanceof Error ? err.message : 'Unknown error';
  console.error('...', error);
  return NextResponse.json({ error }, { status: 500 });
}

}
