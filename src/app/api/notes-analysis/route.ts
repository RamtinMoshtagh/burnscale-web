// src/app/api/notes-analysis/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface NotesAnalysisResult {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  themes: string[]
}

export async function POST(req: Request) {
  try {
    const { notes } = (await req.json()) as { notes?: string }
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'No notes provided.' }, { status: 400 })
    }

    const prompt = `
You are an AI assistant. Analyze the following user journal entry and output JSON only, with no extra text or numbering:

{
  "summary": "<one-sentence summary>",
  "sentiment": "<positive|neutral|negative>",
  "themes": ["<theme1>", "<theme2>", "<theme3>"]
}

Journal Entry:
${notes}
`.trim()

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = resp.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ error: 'AI returned no content.' }, { status: 500 })
    }

    // Parse JSON strictly
    let result: NotesAnalysisResult
    try {
      result = JSON.parse(text)
    } catch {
      console.error('Notes-analysis returned invalid JSON:', text)
      return NextResponse.json(
        { error: 'Notes-analysis returned malformed JSON.' },
        { status: 500 }
      )
    }

    // Validate structure
    if (
      typeof result.summary !== 'string' ||
      !['positive', 'neutral', 'negative'].includes(result.sentiment) ||
      !Array.isArray(result.themes)
    ) {
      console.error('Notes-analysis returned unexpected structure:', result)
      return NextResponse.json(
        { error: 'Notes-analysis returned unexpected data.' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('Notes-analysis error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    )
  }
}
