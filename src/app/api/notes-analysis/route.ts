// src/app/api/notes-analysis/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface NotesAnalysisResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  themes: string[];
}

export async function POST(req: Request) {
  try {
    const { notes } = (await req.json()) as { notes: string };
    if (!notes) {
      return NextResponse.json({ error: 'No notes provided.' }, { status: 400 });
    }

    const prompt = `
You are a diligent AI assistant. Analyze the following user journal entry and return:
1. A one-sentence summary.
2. Overall sentiment (positive, neutral, or negative).
3. Three key themes mentioned.

Entry:
${notes}
`.trim();

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: 'AI returned no content.' }, { status: 500 });
    }

    // Expect JSON in the form: {"summary":"...","sentiment":"...","themes":["a","b","c"]}
    const result = JSON.parse(text) as NotesAnalysisResult;
    return NextResponse.json(result);
  } catch (_err: unknown) {
    console.error('Notes-analysis error:', _err);
    return NextResponse.json(
      { error: (_err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}
