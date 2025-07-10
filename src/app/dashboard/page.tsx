// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabaseServer';
import ZoneSummaryBar from '../components/ZoneSummaryBar';
import TriggerDonutCard from '../components/TriggerDonutCard';

/* ------------------------------------------------------------------ */
/*  Shared zone thresholds – keep UI & calcs in sync                   */
/* ------------------------------------------------------------------ */
export const ZONE_THRESHOLDS = [
  { max: 20, label: 'Energized' },
  { max: 40, label: 'Mild Stress' },
  { max: 60, label: 'Warning Zone' },
  { max: 80, label: 'Burnout Zone' },
  { max: Number.POSITIVE_INFINITY, label: 'Critical' },
] as const;

function zoneLabel(score: number) {
  return ZONE_THRESHOLDS.find((z) => score <= z.max)!.label;
}

/* ------------------------------------------------------------------ */
/*  Row type coming back from SQL                                     */
/* ------------------------------------------------------------------ */
interface Row {
  day: string;                     // YYYY-MM-DD (DATE)
  avg_score: number;
  avg_energy: number;
  avg_meaning: number;
  trigger_counts: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Data loader (single RPC)                                          */
/* ------------------------------------------------------------------ */
async function getWeeklyDashboard(): Promise<Row[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('dashboard_weekly');

  if (error) throw error;
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Server component                                                  */
/* ------------------------------------------------------------------ */
export default async function DashboardPage() {
  let rows: Row[];
  try {
    rows = await getWeeklyDashboard();
  } catch (err) {
    console.error(err);
    return (
      <div className="mt-10 text-center text-red-500" role="alert">
        ⚠️ Failed to load dashboard data.
      </div>
    );
  }

  /* -------- transform once for child cards -------- */
  const burnoutData = rows.map((r) => ({
    date: new Date(r.day).toLocaleDateString(),
    score: r.avg_score,
  }));

  const trendData = rows.map((r) => ({
    date: new Date(r.day).toLocaleDateString(),
    energy: r.avg_energy,
    meaning: r.avg_meaning,
  }));

  const triggerCounts = rows.reduce<Record<string, number>>((acc, r) => {
    for (const [t, n] of Object.entries(r.trigger_counts) as [string, number][]) {
      acc[t] = (acc[t] ?? 0) + n;
    }
    return acc;
  }, {});

  /*  Optional: zone counts for a future card
  const zoneCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const label = zoneLabel(r.avg_score);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  */

  /* ---------------- UI ---------------- */
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-center text-4xl font-bold text-black">
        Your Weekly Wellness Overview
      </h1>

      {/* These <Suspense> wrappers let HTML paint instantly */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-gray-100" />}>
        <ZoneSummaryBar burnoutScores={burnoutData.map((d) => d.score)} />
      </Suspense>

      <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-gray-100" />}>
        <TriggerDonutCard triggerCounts={triggerCounts} />
      </Suspense>
    </div>
  );
}
