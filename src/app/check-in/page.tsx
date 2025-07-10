'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculateBurnoutScore, Mood } from '@/app/utils/calculateBurnoutScore';

const moods = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Meh', emoji: '😐' },
  { label: 'Sad', emoji: '😔' },
  { label: 'Angry', emoji: '😡' },
];

const initialStressOptions = ['Work', 'Sleep', 'Finances', 'Social', 'Health'];
const initialRecoveryOptions = ['Exercise', 'Meditation', 'Talking to someone', 'Rest', 'Music'];

export default function CheckInPage() {
  const router = useRouter();

  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [meaningfulness, setMeaningfulness] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [stressOptions, setStressOptions] = useState(initialStressOptions);
  const [recoveryOptions, setRecoveryOptions] = useState(initialRecoveryOptions);

  const [stressTriggers, setStressTriggers] = useState<string[]>([]);
  const [recoveryActivities, setRecoveryActivities] = useState<string[]>([]);

  const [customStress, setCustomStress] = useState('');
  const [customRecovery, setCustomRecovery] = useState('');

  const toggleOption = (option: string, selected: string[], setSelected: (value: string[]) => void) => {
    setSelected(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  };

  const addCustomOption = (
    value: string,
    options: string[],
    setOptions: (v: string[]) => void,
    selected: string[],
    setSelected: (v: string[]) => void,
    clear: () => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed || options.includes(trimmed)) return;
    setOptions([...options, trimmed]);
    setSelected([...selected, trimmed]);
    clear();
  };

  const deleteOption = (
    option: string,
    options: string[],
    setOptions: (v: string[]) => void,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    setOptions(options.filter((o) => o !== option));
    setSelected(selected.filter((s) => s !== option));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('Authentication error. Please log in.');
      setLoading(false);
      return;
    }

    const burnout_score = calculateBurnoutScore({
      mood: mood as Mood,
      energy,
      meaningfulness,
      stressTriggers,
    });

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      mood,
      energy_level: energy,
      meaningfulness,
      stress_triggers: stressTriggers,
      recovery_activities: recoveryActivities,
      notes,
      burnout_score,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      alert('Error submitting check-in. Try again.');
    } else {
      router.push('/trends');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-800">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">🧠 Daily Check-In</h1>

        {/* Mood */}
        <div>
          <label className="block text-sm font-medium mb-2">Mood</label>
          <div className="flex flex-wrap gap-3">
            {moods.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setMood(m.label)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all shadow-sm ${
                  mood === m.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="energy" className="block text-sm font-medium mb-1">Energy Level: {energy}</label>
            <input
              id="energy"
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label htmlFor="meaningfulness" className="block text-sm font-medium mb-1">Meaningfulness: {meaningfulness}</label>
            <input
              id="meaningfulness"
              type="range"
              min="1"
              max="5"
              value={meaningfulness}
              onChange={(e) => setMeaningfulness(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        {/* Stress Triggers */}
        <div>
          <label className="block text-sm font-medium mb-2">Stress Triggers</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {stressOptions.map((opt) => (
              <div key={opt} className="flex items-center bg-gray-100 rounded-full px-3 py-1 border text-sm">
                <button
                  type="button"
                  onClick={() => toggleOption(opt, stressTriggers, setStressTriggers)}
                  className={`mr-2 ${
                    stressTriggers.includes(opt)
                      ? 'text-red-700 font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  {opt}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    deleteOption(
                      opt,
                      stressOptions,
                      setStressOptions,
                      stressTriggers,
                      setStressTriggers
                    )
                  }
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customStress}
              onChange={(e) => setCustomStress(e.target.value)}
              placeholder="Add custom trigger"
              className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() =>
                addCustomOption(
                  customStress,
                  stressOptions,
                  setStressOptions,
                  stressTriggers,
                  setStressTriggers,
                  () => setCustomStress('')
                )
              }
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Recovery Activities */}
        <div>
          <label className="block text-sm font-medium mb-2">Recovery Activities</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {recoveryOptions.map((opt) => (
              <div key={opt} className="flex items-center bg-gray-100 rounded-full px-3 py-1 border text-sm">
                <button
                  type="button"
                  onClick={() =>
                    toggleOption(opt, recoveryActivities, setRecoveryActivities)
                  }
                  className={`mr-2 ${
                    recoveryActivities.includes(opt)
                      ? 'text-green-700 font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  {opt}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    deleteOption(
                      opt,
                      recoveryOptions,
                      setRecoveryOptions,
                      recoveryActivities,
                      setRecoveryActivities
                    )
                  }
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customRecovery}
              onChange={(e) => setCustomRecovery(e.target.value)}
              placeholder="Add custom activity"
              className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() =>
                addCustomOption(
                  customRecovery,
                  recoveryOptions,
                  setRecoveryOptions,
                  recoveryActivities,
                  setRecoveryActivities,
                  () => setCustomRecovery('')
                )
              }
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else on your mind?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !mood}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
            loading ? 'cursor-not-allowed opacity-80' : ''
          }`}
        >
          {loading && (
            <svg
              className="w-5 h-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {loading ? 'Submitting...' : 'Submit Check-In'}
        </button>
      </div>
    </main>
  );
}
