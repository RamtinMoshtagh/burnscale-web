// /app/api/stress-tips/route.ts
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { triggers } = await req.json();

    if (!Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json({ error: 'No triggers provided.' }, { status: 400 });
    }

    const formatted = triggers.join(', ');

    const prompt = `
You are a helpful wellness coach.
A user has experienced repeated stress from these triggers: ${formatted}.
Provide 2-3 short, evidence-based strategies for each trigger, in a clear and friendly tone.
Keep the response concise, under 150 words.
Return as markdown with bullet points.
`.trim();

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = chat.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'AI did not return content.' }, { status: 500 });
    }

    return NextResponse.json({ advice: content });
  } catch (err: any) {
    console.error('AI tips error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
