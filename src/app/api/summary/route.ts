import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const checkins = body.checkins;

    const formatted = checkins.map((entry: any) => {
      return `Mood: ${entry.mood}, Energy: ${entry.energy_level}, Meaning: ${entry.meaningfulness}, Notes: ${
        entry.notes || 'none'
      }`;
    });

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

    const response = chat.choices[0].message.content || '';
    const summary = response.match(/Summary:\s*(.+)/i)?.[1] || '';
    const imagePrompt = response.match(/Image Prompt:\s*(.+)/i)?.[1] || '';

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl =
  Array.isArray(image.data) && image.data.length > 0 && image.data[0].url
    ? image.data[0].url
    : '';


    return NextResponse.json({ summary, imagePrompt, imageUrl });
  } catch (err: any) {
    console.error('AI MoodBoard Error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
