// src/app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import ZoneSummaryBar from '../components/ZoneSummaryBar';
import TriggerDonutCard from '../components/TriggerDonutCard';

interface Row {
  day: string;                     // e.g. "2025-07-10"
  avg_score: number;
  avg_energy: number;
  avg_meaning: number;
  trigger_counts: Record<string, number>;
}

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('dashboard_weekly');
      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setRows((data as Row[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [supabase]);

  const { burnoutScores, triggerCounts } = useMemo(() => {
    const burnoutScores = rows.map((r) => r.avg_score);
    const triggerCounts: Record<string, number> = {};
    for (const r of rows) {
      for (const [t, n] of Object.entries(r.trigger_counts)) {
        triggerCounts[t] = (triggerCounts[t] ?? 0) + n;
      }
    }
    return { burnoutScores, triggerCounts };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="animate-pulse text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 text-center text-red-500" role="alert">
        ⚠️ Failed to load dashboard: {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-10 text-center text-gray-500">
        No data for the past week.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-center text-4xl font-bold text-black">
        Your Weekly Wellness Overview
      </h1>
      <ZoneSummaryBar burnoutScores={burnoutScores} />
      <TriggerDonutCard triggerCounts={triggerCounts} />
    </div>
  );
}
