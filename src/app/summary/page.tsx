'use client';

import { useEffect, useState } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .order('created_at', { ascending: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!error && data.length > 0) {
        setCheckins(data);

        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkins: data }),
        });

        const result = await res.json();
        setAiSummary(result.summary);
        setImagePrompt(result.imagePrompt);
        setImageUrl(result.imageUrl);

        // Save the generated moodboard to Supabase
        const { error: saveError } = await supabase.from('moodboards').insert([
          {
            summary: result.summary,
            image_prompt: result.imagePrompt,
            image_url: result.imageUrl,
          },
        ]);

        if (!saveError) setSaved(true);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'moodboard.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎨 MoodBoard AI</h1>

        {loading ? (
          <p>Loading...</p>
        ) : checkins.length === 0 ? (
          <p>No check-ins to summarize.</p>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">🧠 AI Summary of Your Week</h2>
              <p className="text-gray-700 whitespace-pre-line">{aiSummary}</p>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">🖼️ Mood Visual</h2>
              <p className="text-sm text-gray-500 mb-3">Prompt: {imagePrompt}</p>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Moodboard"
                  className="w-full h-64 object-cover rounded-lg shadow"
                />
              )}
            </div>

            <div className="text-center mt-8 space-y-2">
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                📤 Download MoodBoard
              </button>
              {saved && (
                <p className="text-sm text-green-600">Moodboard saved to your journal ✅</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
