// src/app/api/notes-insights/route.ts
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { notes } = (await req.json()) as { notes?: string };
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'No notes provided.' }, { status: 400 });
    }

    const prompt = `
You are a helpful wellness coach.
Given this free-text journal entry, return JSON with:
  "summary": a 1–2 sentence overview,
  "sentiment": "positive"|"neutral"|"negative",
  "themes": an array of up to 3 keywords/topics.

Notes:
"${notes.trim()}"
    `.trim();

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = chat.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('AI returned empty content');

    // Sometimes the model wraps JSON in backticks or text—let’s strip that
    const jsonText = content
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse AI output:', { raw: content });
      throw new Error('Failed to parse AI response as JSON');
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('/api/notes-insights error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
