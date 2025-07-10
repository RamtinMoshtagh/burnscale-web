// src/app/dashboard/page.tsx
import { supabaseServer } from '@/lib/supabaseServer';
import TrendsCard from '../components/TrendsCard';
import TriggerDonutCard from '../components/TriggerDonutCard';
import ZoneSummaryBar from '../components/ZoneSummaryBar';

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('checkins')
    .select('created_at, burnout_score, energy_level, meaningfulness, stress_triggers')
    .gte('created_at', oneWeekAgo)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching check-ins:', error);
    return <div className="text-red-500 text-center mt-10">⚠️ Failed to load dashboard data.</div>;
  }

  const burnoutData = [];
  const trendData = [];
  const triggerCounts: Record<string, number> = {};
  const zoneCounts = {
    Energized: 0,
    'Mild Stress': 0,
    'Warning Zone': 0,
    'Burnout Zone': 0,
    Critical: 0,
  };

  const getZoneLabel = (score: number): keyof typeof zoneCounts => {
    if (score <= 20) return 'Energized';
    if (score <= 40) return 'Mild Stress';
    if (score <= 60) return 'Warning Zone';
    if (score <= 80) return 'Burnout Zone';
    return 'Critical';
  };

  for (const entry of data || []) {
    const date = new Date(entry.created_at).toLocaleDateString();
    const score = entry.burnout_score ?? 0;

    burnoutData.push({ date, score });
    trendData.push({ date, energy: entry.energy_level ?? 0, meaning: entry.meaningfulness ?? 0 });

    zoneCounts[getZoneLabel(score)]++;

    for (const trigger of entry.stress_triggers || []) {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-4xl font-bold text-center text-black">Your Weekly Wellness Overview</h1>

      <ZoneSummaryBar burnoutScores={burnoutData.map((d) => d.score)} />
      <TriggerDonutCard triggerCounts={triggerCounts} />
      <TrendsCard data={trendData} />
    </div>
  );
}
