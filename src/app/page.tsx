'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const moods = ['😊 Happy', '😐 Meh', '😔 Sad', '😡 Angry'];
const initialStressOptions = ['Work', 'Sleep', 'Finances', 'Social', 'Health'];
const initialRecoveryOptions = ['Exercise', 'Meditation', 'Talking to someone', 'Rest', 'Music'];

export default function HomePage() {
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [meaningfulness, setMeaningfulness] = useState(3);
  const [stressOptions, setStressOptions] = useState(initialStressOptions);
  const [recoveryOptions, setRecoveryOptions] = useState(initialRecoveryOptions);
  const [stressTriggers, setStressTriggers] = useState<string[]>([]);
  const [recoveryActivities, setRecoveryActivities] = useState<string[]>([]);
  const [customStress, setCustomStress] = useState('');
  const [customRecovery, setCustomRecovery] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleOption = (option: string, selected: string[], setSelected: (v: string[]) => void) => {
    setSelected(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    );
  };

  const addOption = (
    value: string,
    options: string[],
    setOptions: (v: string[]) => void,
    selected: string[],
    setSelected: (v: string[]) => void,
    clear: () => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      setSelected([...selected, trimmed]);
    }
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
      alert('Not authenticated.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      mood,
      energy_level: energy,
      meaningfulness,
      stress_triggers: stressTriggers,
      recovery_activities: recoveryActivities,
      notes,
    });

    setLoading(false);

    if (!error) {
      router.push('/trends');
    } else {
      alert('Error submitting check-in');
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10 text-gray-800">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">🧠 Daily Check-In</h1>

        <div className="space-y-6">
          {/* Mood */}
          <div>
            <label className="block text-sm font-medium mb-1">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a mood</option>
              {moods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Energy */}
          <div>
            <label className="block text-sm font-medium mb-1">Energy Level: {energy}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Meaningfulness */}
          <div>
            <label className="block text-sm font-medium mb-1">Meaningfulness: {meaningfulness}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={meaningfulness}
              onChange={(e) => setMeaningfulness(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Stress Triggers */}
          <div>
            <label className="block text-sm font-medium mb-2">Stress Triggers</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {stressOptions.map((opt) => (
                <div key={opt} className="flex items-center bg-gray-100 rounded-full px-3 py-1 border text-sm">
                  <button
                    onClick={() => toggleOption(opt, stressTriggers, setStressTriggers)}
                    className={`mr-2 ${
                      stressTriggers.includes(opt) ? 'text-red-700 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                  <button
                    onClick={() => deleteOption(opt, stressOptions, setStressOptions, stressTriggers, setStressTriggers)}
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
                className="flex-1 px-3 py-1 border rounded-lg text-sm"
              />
              <button
                onClick={() =>
                  addOption(customStress, stressOptions, setStressOptions, stressTriggers, setStressTriggers, () => setCustomStress(''))
                }
                className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
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
                    onClick={() => toggleOption(opt, recoveryActivities, setRecoveryActivities)}
                    className={`mr-2 ${
                      recoveryActivities.includes(opt) ? 'text-green-700 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                  <button
                    onClick={() => deleteOption(opt, recoveryOptions, setRecoveryOptions, recoveryActivities, setRecoveryActivities)}
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
                className="flex-1 px-3 py-1 border rounded-lg text-sm"
              />
              <button
                onClick={() =>
                  addOption(customRecovery, recoveryOptions, setRecoveryOptions, recoveryActivities, setRecoveryActivities, () => setCustomRecovery(''))
                }
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Anything else on your mind?"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !mood}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg w-full transition flex items-center justify-center gap-2 ${
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? 'Submitting...' : 'Submit Check-In'}
          </button>
        </div>
      </div>
    </main>
  );
}
