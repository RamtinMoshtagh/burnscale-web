import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CheckInEntry {
  mood: string;
  energy_level: number;
  meaningfulness: number;
  notes?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const checkins: CheckInEntry[] = body.checkins;

    if (!Array.isArray(checkins) || checkins.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty check-in data.' },
        { status: 400 }
      );
    }

    const formatted = checkins.map((entry) =>
      `Mood: ${entry.mood}, Energy: ${entry.energy_level}, Meaning: ${entry.meaningfulness}, Notes: ${entry.notes || 'none'}`
    );

    const prompt = `
You are a helpful wellness assistant.
Given the following emotional logs, summarize the user's week in 2–3 sentences.
Then suggest a short visual image prompt for AI art based on their emotional state.

Return in this format:
Summary: ...
Image Prompt: ...

Logs:
${formatted.join('\n')}
    `.trim();

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = chat.choices?.[0]?.message?.content || '';
    const summaryMatch = content.match(/Summary:\s*(.+)/i);
    const promptMatch = content.match(/Image Prompt:\s*(.+)/i);

    const summary = summaryMatch?.[1]?.trim() || '';
    const imagePrompt = promptMatch?.[1]?.trim() || '';

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl =
      Array.isArray(image.data) && image.data[0]?.url
        ? image.data[0].url
        : '';

    return NextResponse.json({ summary, imagePrompt, imageUrl });
  } catch (err: unknown) {
    console.error('AI MoodBoard Error:', (err as Error).message);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
