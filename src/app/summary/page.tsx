// src/app/summary/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface CheckIn {
  created_at: string;
  mood: string;
  notes: string | null;
  energy_level: number;
  meaningfulness: number;
  stress_triggers?: string[];
  recovery_activities?: string[];
}

interface AIResult {
  summary: string;
  imagePrompt: string;
  imageUrl: string;
  personalReflection: string;
}

interface NotesInsights {
  summary: string;
  sentiment: string;
  themes: string[];
}

export default function SummaryPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAIResult] = useState<AIResult | null>(null);
  const [notesInsights, setNotesInsights] = useState<NotesInsights | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [frequentTriggers, setFrequentTriggers] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch check-ins and generate moodboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const oneWeekAgo = new Date(Date.now() - 7 * 86400e3).toISOString();
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

        // frequent stress triggers (≥3)
        const triggerMap: Record<string, number> = {};
        checkinData.forEach(entry => {
          entry.stress_triggers?.forEach((trigger: string | number) => {
            triggerMap[trigger] = (triggerMap[trigger] || 0) + 1;
          });
        });
        setFrequentTriggers(
          Object.entries(triggerMap)
            .filter(([, cnt]) => cnt >= 3)
            .map(([t]) => t)
        );

        // AI moodboard summary & image via your proxy
        const res = await fetch('/api/openai-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkins: checkinData }),
        });
        const result = await res.json();
        if (
          !result.summary ||
          !result.imagePrompt ||
          !result.personalReflection
        ) {
          throw new Error('AI failed to generate a complete summary');
        }
        setAIResult({
          summary: result.summary,
          imagePrompt: result.imagePrompt,
          imageUrl: result.imageUrl || '',
          personalReflection: result.personalReflection,
        });

        // save moodboard
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw userError ?? new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('moodboards')
        .insert([
          {
            user_id: user.id,
            summary: result.summary,
            prompt: result.imagePrompt,
            image_url: result.imageUrl,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSaved(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Summary error:', error);
      setError('Something went wrong while generating your moodboard.');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // Analyze free-form notes separately
useEffect(() => {
  if (!checkins.length) return;

  const allNotes = checkins
    .map((c) => c.notes?.trim())
    .filter((n): n is string => !!n)
    .join('\n\n');
  if (!allNotes) return;

  (async () => {
    try {
      const res = await fetch('/api/notes-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: allNotes }),
      });
      const json = await res.json();
      if (!res.ok) {
        // server returned a 4xx/5xx
        throw new Error(json.error || 'Notes analysis failed');
      }
      setNotesInsights({
        summary: json.summary,
        sentiment: json.sentiment,
        themes: json.themes,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Notes analysis error:', error);
      setNotesError(error.message);
    }
  })();
}, [checkins]);


  const handleDownload = useCallback(() => {
    if (!aiResult?.imageUrl) return;
    const link = document.createElement('a');
    link.href = aiResult.imageUrl;
    link.download = 'moodboard.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [aiResult]);

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
            <p className="text-gray-500 text-sm animate-pulse">
              Generating your insights...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : checkins.length === 0 || !aiResult ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No check-ins to summarize yet.</p>
          </div>
        ) : (
          <>
            {/* Free-text Notes Insights */}
            <section className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h2 className="text-xl font-semibold">📝 Notes Insights</h2>
              {notesError ? (
                <p className="text-red-600">{notesError}</p>
              ) : !notesInsights ? (
                <p className="text-gray-500">Analyzing your notes…</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Summary:</strong> {notesInsights.summary}
                  </p>
                  <p>
                    <strong>Sentiment:</strong> {notesInsights.sentiment}
                  </p>
                  <p>
                    <strong>Themes:</strong>{' '}
                    {notesInsights.themes.length > 0
                      ? notesInsights.themes.join(', ')
                      : 'None detected'}
                  </p>
                </div>
              )}
            </section>

            {/* Personalized Reflection */}
            <section className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h2 className="text-xl font-semibold">💬 Personalized Reflection</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {aiResult.personalReflection}
              </p>
            </section>

            {/* Trigger Pattern & Tips */}
            {frequentTriggers.length > 0 && (
              <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md space-y-2">
                <h3 className="font-semibold text-yellow-800">
                  🧠 Trigger Pattern Detected
                </h3>
                <p className="text-sm text-yellow-700">
                  I’ve noticed that{' '}
                  <strong>{frequentTriggers.join(', ')}</strong> keep showing up
                  as stress triggers. Would you like some tips?
                </p>
                <button
                  onClick={handleGetTips}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition"
                >
                  {tipsLoading ? 'Loading...' : '💡 Show Me Tips'}
                </button>
                {tipsError && (
                  <p className="text-red-500 text-sm mt-1">{tipsError}</p>
                )}
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
                Prompt: <span className="italic">{aiResult.imagePrompt}</span>
              </p>
              {aiResult.imageUrl ? (
                <Image
                  src={aiResult.imageUrl}
                  alt="Moodboard generated by AI"
                  width={1024}
                  height={512}
                  className="w-full h-64 object-cover rounded-lg shadow"
                />
              ) : (
                <p className="text-gray-400 italic">No image generated</p>
              )}
            </section>

            {/* Download & Save Notice */}
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
