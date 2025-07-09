import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // temp workaround for client use
});

export async function generateAiSummary(checkins: any[]) {
  const formatted = checkins.map((entry) => {
    return `Mood: ${entry.mood}, Energy: ${entry.energy_level}, Meaning: ${entry.meaningfulness}, Notes: ${
      entry.notes || 'none'
    }`;
  });

  const prompt = `
You are a helpful wellness assistant.
Given the following daily emotional logs from a user over the past week, summarize the overall tone and emotional pattern of the week in 2-3 sentences.
Then, based on that summary, create a visual image prompt suitable for an AI image generator like DALL·E.

Example format:
Summary: "...text..."
Image Prompt: "...prompt..."

Logs:
${formatted.join('\n')}
  `.trim();

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const response = chat.choices[0].message.content || '';
  const summaryMatch = response.match(/Summary:\s*(.+)/i);
  const promptMatch = response.match(/Image Prompt:\s*(.+)/i);

  return {
    summary: summaryMatch?.[1] || '',
    prompt: promptMatch?.[1] || '',
  };
}
