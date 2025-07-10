'use client';

/* -----------------------------------------------------------------------
   BurnScale Web • Daily Check-In
   -----------------------------------------------------------------------
   • TanStack Query v5 (strict generics, v5 API)
   • Optimistic add/hide with UNDO toast
   • Reusable MoodSelector & ChipInputList
   --------------------------------------------------------------------- */

import { useState, useMemo } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculateBurnoutScore, Mood } from '@/app/utils/calculateBurnoutScore';

/* ──────────────────────────────────────────────────────────────────── */
/* 0.  Types & constants                                               */
/* ──────────────────────────────────────────────────────────────────── */
type CustomType = 'mood' | 'stress_trigger' | 'recovery_activity';

interface CustomRow {
  type: CustomType;
  value: string;
  is_active: boolean;
}

const DEFAULT_MOODS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Meh', emoji: '😐' },
  { label: 'Sad', emoji: '😔' },
  { label: 'Angry', emoji: '😡' },
] as const;

const DEFAULT_STRESS = ['Work', 'Sleep', 'Finances', 'Social', 'Health'] as const;
const DEFAULT_RECOVERY = [
  'Exercise',
  'Meditation',
  'Talking to someone',
  'Rest',
  'Music',
] as const;

/* ──────────────────────────────────────────────────────────────────── */
/* 1.  Supabase helpers                                                */
/* ──────────────────────────────────────────────────────────────────── */
async function fetchCustomizations(): Promise<CustomRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_customizations')
    .select('type,value,is_active')
    .eq('user_id', user.id);

  if (error || !data) throw error ?? new Error('Failed to fetch');
  return data as CustomRow[];
}

async function upsertCustomization(vars: { type: CustomType; value: string }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('user_customizations').upsert(
    { user_id: user.id, type: vars.type, value: vars.value, is_active: true },
    { onConflict: 'user_id,type,value' }
  );
}

async function hideCustomization(vars: { type: CustomType; value: string }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('user_customizations').upsert(
    { user_id: user.id, type: vars.type, value: vars.value, is_active: false },
    { onConflict: 'user_id,type,value' }
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* 2.  Reusable components                                             */
/* ──────────────────────────────────────────────────────────────────── */

/** Single-select mood list */
function MoodSelector({
  mood,
  setMood,
  options,
  onAdd,
  onHide,
}: {
  mood: string;
  setMood: (v: string) => void;
  options: { label: string; emoji: string }[];
  onAdd: (label: string) => void;
  onHide: (label: string) => void;
}) {
  const [input, setInput] = useState('');

  return (
    <section>
      <label className="mb-2 block text-sm font-medium">Mood</label>

      <div className="flex flex-wrap gap-3">
        {options.map((m) => {
          const isDefault = DEFAULT_MOODS.some((d) => d.label === m.label);
          return (
            <div key={m.label} className="relative">
              <button
                type="button"
                aria-pressed={mood === m.label}
                onClick={() => setMood(m.label)}
                className={`flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition shadow-sm ${
                  mood === m.label
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
              {!isDefault && (
                <button
                  aria-label={`Hide mood ${m.label}`}
                  onClick={() => onHide(m.label)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1 text-xs leading-none text-white"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom mood */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add custom mood"
          className="flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = input.trim();
            if (!trimmed) return;
            onAdd(trimmed);
            setInput('');
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </div>
    </section>
  );
}

/** Multi-select chip list (stress / recovery) */
function ChipInputList({
  label,
  type,
  options,
  selected,
  setSelected,
  onAdd,
  onHide,
}: {
  label: string;
  type: CustomType;
  options: string[];
  selected: string[];
  setSelected: (v: string[]) => void;
  onAdd: (v: string) => void;
  onHide: (v: string) => void;
}) {
  const [input, setInput] = useState('');

  function toggle(value: string) {
    setSelected(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  const colour =
    type === 'stress_trigger'
      ? { active: 'text-red-700', addBtn: 'bg-red-600' }
      : { active: 'text-green-700', addBtn: 'bg-green-600' };

  return (
    <section>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <div className="mb-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-1 rounded-full border bg-gray-100 px-3 py-1 text-sm"
          >
            <button
              type="button"
              aria-pressed={selected.includes(opt)}
              onClick={() => toggle(opt)}
              className={
                selected.includes(opt) ? `${colour.active} font-semibold` : 'text-gray-600'
              }
            >
              {opt}
            </button>
            <button
              aria-label={`Hide ${opt}`}
              onClick={() => onHide(opt)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add custom ${
            type === 'stress_trigger' ? 'trigger' : 'activity'
          }`}
          className="flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = input.trim();
            if (!trimmed) return;
            onAdd(trimmed);
            setInput('');
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${colour.addBtn}`}
        >
          Add
        </button>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* 3.  QueryClient provider wrapper                                    */
/* ──────────────────────────────────────────────────────────────────── */
const queryClient = new QueryClient();

export default function CheckInPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <CheckInPage />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* 4.  Main page component                                            */
/* ──────────────────────────────────────────────────────────────────── */
function CheckInPage() {
  const router = useRouter();
  const qc = useQueryClient();

  /* ---------------- Fetch customisations ------------------------ */
  const {
    data: rows = [],
    isLoading,
  } = useQuery<CustomRow[], Error>({
    queryKey: ['customizations'],
    queryFn: fetchCustomizations,
    staleTime: 60_000,
  });

  /* ---------------- Derive option pools ------------------------- */
  const { moodOptions, stressOptions, recoveryOptions } = useMemo(() => {
    const hidden = new Set(
      rows.filter((r) => !r.is_active).map((r) => `${r.type}:${r.value.toLowerCase()}`)
    );
    const activeRows = rows.filter((r) => r.is_active);

    /* moods */
    const moodAdd = activeRows
      .filter((r) => r.type === 'mood')
      .map((r) => ({ label: r.value, emoji: '✨' }));
    const moods = [...DEFAULT_MOODS, ...moodAdd].filter(
      (m) => !hidden.has(`mood:${m.label.toLowerCase()}`)
    );

    /* stress */
    const stressAdd = activeRows
      .filter((r) => r.type === 'stress_trigger')
      .map((r) => r.value);
    const stress = [...new Set([...DEFAULT_STRESS, ...stressAdd])].filter(
      (v) => !hidden.has(`stress_trigger:${v.toLowerCase()}`)
    );

    /* recovery */
    const recAdd = activeRows
      .filter((r) => r.type === 'recovery_activity')
      .map((r) => r.value);
    const recovery = [...new Set([...DEFAULT_RECOVERY, ...recAdd])].filter(
      (v) => !hidden.has(`recovery_activity:${v.toLowerCase()}`)
    );

    return { moodOptions: moods, stressOptions: stress, recoveryOptions: recovery };
  }, [rows]);

  /* ---------------- Mutations (optimistic) ---------------------- */
  const addMut = useMutation<
    void,
    Error,
    { type: CustomType; value: string },
    { prev: CustomRow[] }
  >({
    mutationFn: upsertCustomization,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['customizations'] });
      const prev = qc.getQueryData<CustomRow[]>(['customizations']) ?? [];

      qc.setQueryData<CustomRow[]>(['customizations'], (old) => {
        const base = old ?? [];
        const idx = base.findIndex(
          (r) =>
            r.type === vars.type && r.value.toLowerCase() === vars.value.toLowerCase()
        );
        if (idx >= 0) {
          const clone = [...base];
          clone[idx] = { ...clone[idx], is_active: true };
          return clone;
        }
        const newRow: CustomRow = {
          type: vars.type,
          value: vars.value,
          is_active: true,
        };
        return [...base, newRow];
      });

      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['customizations'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['customizations'] }),
  });

  const hideMut = useMutation<
    void,
    Error,
    { type: CustomType; value: string },
    { prev: CustomRow[] }
  >({
    mutationFn: hideCustomization,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['customizations'] });
      const prev = qc.getQueryData<CustomRow[]>(['customizations']) ?? [];

      qc.setQueryData<CustomRow[]>(['customizations'], (old) =>
        (old ?? []).map((r) =>
          r.type === vars.type && r.value === vars.value ? { ...r, is_active: false } : r
        )
      );

      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['customizations'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['customizations'] }),
  });

  /* ---------------- Form state ---------------------------------- */
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [meaningfulness, setMeaningfulness] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [stressTriggers, setStressTriggers] = useState<string[]>([]);
  const [recoveryActivities, setRecoveryActivities] = useState<string[]>([]);

  /* ---------------- Helpers ------------------------------------- */
  function optimisticAdd(type: CustomType, value: string) {
    addMut.mutate({ type, value });
  }

  function optimisticHide(type: CustomType, value: string) {
    hideMut.mutate({ type, value });
    toast(
      (t) => (
        <span className="flex items-center gap-2">
          Hidden <b>{value}</b>
          <button
            className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
            onClick={() => {
              addMut.mutate({ type, value });
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </span>
      ),
      { duration: 4000 }
    );
  }

  /* ---------------- Submit handler ------------------------------ */
  async function handleSubmit() {
    if (!mood) return;
    setSubmitting(true);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      alert('Please log in.');
      setSubmitting(false);
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

    setSubmitting(false);
    if (error) {
      console.error(error);
      alert('Error submitting check-in.');
      return;
    }
    router.push('/trends');
  }

  /* ---------------- UI ------------------------------------------ */
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-800">
      <div className="mx-auto max-w-2xl space-y-10 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-extrabold">
          <span role="img" aria-label="brain">
            🧠
          </span>{' '}
          Daily Check-In
        </h1>

        {/* Mood */}
        <MoodSelector
          mood={mood}
          setMood={setMood}
          options={moodOptions}
          onAdd={(v) => optimisticAdd('mood', v)}
          onHide={(v) => optimisticHide('mood', v)}
        />

        {/* Sliders */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Energy Level: {energy}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Meaningfulness: {meaningfulness}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={meaningfulness}
              onChange={(e) => setMeaningfulness(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </section>

        {/* Stress triggers */}
        <ChipInputList
          label="Stress Triggers"
          type="stress_trigger"
          options={stressOptions}
          selected={stressTriggers}
          setSelected={setStressTriggers}
          onAdd={(v) => optimisticAdd('stress_trigger', v)}
          onHide={(v) => optimisticHide('stress_trigger', v)}
        />

        {/* Recovery activities */}
        <ChipInputList
          label="Recovery Activities"
          type="recovery_activity"
          options={recoveryOptions}
          selected={recoveryActivities}
          setSelected={setRecoveryActivities}
          onAdd={(v) => optimisticAdd('recovery_activity', v)}
          onHide={(v) => optimisticHide('recovery_activity', v)}
        />

        {/* Notes */}
        <section>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else on your mind?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !mood}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition ${
            submitting
              ? 'cursor-not-allowed bg-blue-400 opacity-80'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? (
            <svg
              className="h-5 w-5 animate-spin text-white"
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
          ) : (
            'Submit Check-In'
          )}
        </button>
      </div>
    </main>
  );
}
