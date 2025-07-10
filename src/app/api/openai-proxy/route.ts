import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

interface CheckIn {
  mood: string;
  energy_level: number;
  meaningfulness: number;
  notes?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { checkins: CheckIn[] };
const checkins = body.checkins;


    if (!Array.isArray(checkins) || checkins.length === 0) {
      return NextResponse.json({ error: 'Invalid check-in data.' }, { status: 400 });
    }

    const formatted = checkins.map((entry: CheckIn) =>
      `Mood: ${entry.mood}, Energy: ${entry.energy_level}, Meaning: ${entry.meaningfulness}, Notes: ${entry.notes || 'none'}`
    );

    const prompt = `
You are a helpful wellness assistant.
Given the following logs, summarize the user's week in 2–3 sentences.
Then suggest a visual image prompt for AI art based on their emotional state.
Finally, reflect on the user's wellbeing this week in a personalized tone with practical advice.

Return in this format:
Summary: ...
Image Prompt: ...
Personal Reflection: ...

Logs:
${formatted.join('\n')}
    `.trim();

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = chat.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'AI response was empty.' }, { status: 500 });
    }

    const summaryMatch = content.match(/Summary:\s*(.+)/i);
    const promptMatch = content.match(/Image Prompt:\s*(.+)/i);
    const reflectionMatch = content.match(/Personal Reflection:\s*(.+)/i);

    const summary = summaryMatch?.[1]?.trim() || '';
    const imagePrompt = promptMatch?.[1]?.trim() || '';
    const personalReflection = reflectionMatch?.[1]?.trim() || '';

    if (!summary || !imagePrompt || !personalReflection) {
      return NextResponse.json({ error: 'AI failed to generate complete response.' }, { status: 500 });
    }

    let imageUrl = '';

    try {
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      imageUrl = image.data?.[0]?.url || '';
    } catch (imageError) {
      console.error('Image generation failed:', imageError);
    }

    return NextResponse.json({ summary, imagePrompt, imageUrl, personalReflection });
  } catch (err: unknown) {
  const error = err instanceof Error ? err.message : 'Unknown error';
  console.error('Proxy error:', error);

  return NextResponse.json(
    { error, details: err },
    { status: 500 }
  );
}

}
