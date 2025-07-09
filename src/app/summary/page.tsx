'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CheckIn {
  created_at: string;
  mood: string;
  notes: string | null;
  energy_level: number;
  meaningfulness: number;
  stress_triggers?: string[];
  recovery_activities?: string[];
}

export default function SummaryPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [personalReflection, setPersonalReflection] = useState('');
  const [frequentTriggers, setFrequentTriggers] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: checkinData, error: checkinError } = await supabase
          .from('checkins')
          .select('*')
          .order('created_at', { ascending: true })
          .gte('created_at', oneWeekAgo);

        if (checkinError) throw checkinError;
        if (!checkinData || checkinData.length === 0) {
          setCheckins([]);
          setLoading(false);
          return;
        }

        setCheckins(checkinData);

        // Detect frequently repeated stress triggers
        const triggerMap: Record<string, number> = {};
        checkinData.forEach((entry) => {
entry.stress_triggers?.forEach((trigger: string) => {
            triggerMap[trigger] = (triggerMap[trigger] || 0) + 1;
          });
        });
        const frequent = Object.entries(triggerMap)
          .filter(([, count]) => count >= 3)
          .map(([trigger]) => trigger);
        setFrequentTriggers(frequent);

        // Generate AI summary
        const response = await fetch('/api/openai-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkins: checkinData }),
        });

        const result = await response.json();
        if (!result.summary || !result.imagePrompt || !result.personalReflection) {
          throw new Error('AI failed to generate a complete summary');
        }

        setAiSummary(result.summary);
        setImagePrompt(result.imagePrompt);
        setImageUrl(result.imageUrl || '');
        setPersonalReflection(result.personalReflection);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError;

        const { error: insertError } = await supabase.from('moodboards').insert([
          {
            user_id: user.id,
            summary: result.summary,
            prompt: result.imagePrompt,
            image_url: result.imageUrl,
          },
        ]);

        if (insertError) throw insertError;
        setSaved(true);
      } catch (err) {
        console.error('Summary error:', err);
        setError('Something went wrong while generating your moodboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'moodboard.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  const handleGetTips = async () => {
    setTips([]);
    setTipsError('');
    setTipsLoading(true);

    try {
      const res = await fetch('/api/tips-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggers: frequentTriggers }),
      });

      const data = await res.json();
      if (!data.tips || !Array.isArray(data.tips)) {
        throw new Error(data.error || 'No tips returned');
      }

      setTips(data.tips);
    } catch (err) {
      console.error('Tips error:', err);
      setTipsError('Failed to load tips.');
    } finally {
      setTipsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-800">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">🎨 MoodBoard AI</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm animate-pulse">Generating your insights...</p>
          </div>
        ) : checkins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No check-ins to summarize yet.</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Reflection */}
            <section className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h2 className="text-xl font-semibold">💬 Personalized Reflection</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{personalReflection}</p>
            </section>

            {/* Pattern Detection + CTA */}
            {frequentTriggers.length > 0 && (
              <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md space-y-2">
                <h3 className="font-semibold text-yellow-800">🧠 Trigger Pattern Detected</h3>
                <p className="text-sm text-yellow-700">
                  I’ve noticed that <strong>{frequentTriggers.join(', ')}</strong> keep showing up as
                  stress triggers. Would you like some tips or techniques that might help?
                </p>
                <button
                  onClick={handleGetTips}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition"
                >
                  {tipsLoading ? 'Loading...' : '💡 Show Me Tips'}
                </button>
                {tipsError && <p className="text-red-500 text-sm mt-1">{tipsError}</p>}
                {tips.length > 0 && (
                  <ul className="mt-3 list-disc list-inside text-sm text-gray-800 space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx}>💡 {tip}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Visual Moodboard */}
            <section className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h2 className="text-xl font-semibold">🖼️ Visual Mood Snapshot</h2>
              <p className="text-sm text-gray-500">
                Prompt used: <span className="italic">{imagePrompt}</span>
              </p>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Moodboard generated by AI"
                  className="w-full h-64 object-cover rounded-lg shadow"
                />
              ) : (
                <p className="text-gray-400 italic">No image generated</p>
              )}
            </section>

            {/* Download Button */}
            <div className="text-center mt-6 space-y-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                📤 Download MoodBoard
              </button>
              {saved && (
                <p className="text-sm text-green-600 font-medium">
                  ✅ Moodboard saved to your journal
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
