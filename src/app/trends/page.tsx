'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';

// Register necessary Chart.js components, including the Category scale for the x-axis
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Lazily import only the <Line /> component from react-chartjs-2
const Line = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  { ssr: false }
);

interface CheckIn {
  created_at: string;
  mood: string;
  energy_level: number;
  meaningfulness: number;
}

export default function TrendsPage() {
  const supabase = useSupabaseClient();
  const [rows, setRows] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the last 7 days of check-ins
  useEffect(() => {
    const fetchWeek = async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('checkins')
        .select('created_at,mood,energy_level,meaningfulness')
        .gte('created_at', since)
        .order('created_at');

      if (error) setError(error.message);
      else setRows(data as CheckIn[]);
      setLoading(false);
    };
    fetchWeek();
  }, [supabase]);

  // Compute labels, chartData and stats only when rows change
  const stats = useMemo(() => {
    if (!rows.length) {
      return {
        labels: [] as string[],
        chartData: {} as ChartData<'line'>,
        total: 0,
        mostMood: { mood: '', count: 0 },
        highestMeaning: { day: '', value: 0 },
        lowestEnergy: { day: '', value: 0 },
      };
    }

    const labels = rows.map((r) =>
      new Date(r.created_at).toLocaleDateString(undefined, { weekday: 'short' })
    );

    const chartData: ChartData<'line'> = {
      labels,
      datasets: [
        {
          label: 'Energy',
          data: rows.map((r) => r.energy_level),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.3,
        },
        {
          label: 'Meaningfulness',
          data: rows.map((r) => r.meaningfulness),
          borderColor: '#9333ea',
          backgroundColor: 'rgba(147,51,234,0.2)',
          tension: 0.3,
        },
      ],
    };

    const moodCount: Record<string, number> = {};
    let highestMeaning = { day: '', value: 0 };
    let lowestEnergy = { day: '', value: 10 };

    rows.forEach((r) => {
      moodCount[r.mood] = (moodCount[r.mood] ?? 0) + 1;
      const dayLabel = new Date(r.created_at).toLocaleDateString(undefined, { weekday: 'short' });

      if (r.meaningfulness > highestMeaning.value) {
        highestMeaning = { value: r.meaningfulness, day: dayLabel };
      }
      if (r.energy_level < lowestEnergy.value) {
        lowestEnergy = { value: r.energy_level, day: dayLabel };
      }
    });

    const mostMood = Object.entries(moodCount).reduce(
      (acc, [m, count]) => (count > acc.count ? { mood: m, count } : acc),
      { mood: '', count: 0 }
    );

    return {
      labels,
      chartData,
      total: rows.length,
      mostMood,
      highestMeaning,
      lowestEnergy,
    };
  }, [rows]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-800">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
          📈 Weekly Trends
        </h1>

        {loading && (
          <p className="animate-pulse text-center text-gray-500">
            Loading trend data…
          </p>
        )}

        {error && (
          <p className="text-center text-red-600">
            Unable to load data: {error}
          </p>
        )}

        {!loading && !error && stats.total === 0 && (
          <p className="text-center text-gray-500">
            No check-ins for the past 7 days.
          </p>
        )}

        {!loading && !error && stats.total > 0 && (
          <>
            <section className="mb-6 rounded-xl bg-white p-4 shadow">
              <Line data={stats.chartData} />
            </section>

            <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Stat label="Total check-ins" value={stats.total} />
              <Stat
                label="Most common mood"
                value={stats.mostMood.mood || 'N/A'}
                sub={`(${stats.mostMood.count})`}
              />
              <Stat
                label="Highest meaningful day"
                value={stats.highestMeaning.day || '—'}
                sub={stats.highestMeaning.value.toString()}
              />
              <Stat
                label="Lowest energy day"
                value={stats.lowestEnergy.day || '—'}
                sub={stats.lowestEnergy.value.toString()}
              />
            </section>

            <div className="text-center">
              <Link
                href="/summary"
                className="inline-flex items-center rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
              >
                🎨 View Weekly MoodBoard&nbsp;AI
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow">
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
