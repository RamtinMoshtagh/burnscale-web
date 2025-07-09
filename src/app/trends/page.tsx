'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

interface CheckIn {
  created_at: string;
  mood: string;
  energy_level: number;
  meaningfulness: number;
}

export default function TrendsPage() {
  const [data, setData] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckins = async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('created_at, mood, energy_level, meaningfulness')
        .order('created_at', { ascending: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!error && data) setData(data);
      setLoading(false);
    };

    fetchCheckins();
  }, []);

  const labels = data.map((d) =>
    new Date(d.created_at).toLocaleDateString('en-US', { weekday: 'short' })
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Energy Level',
        data: data.map((d) => d.energy_level),
        borderColor: '#3b82f6',
        backgroundColor: '#93c5fd',
        tension: 0.3,
      },
      {
        label: 'Meaningfulness',
        data: data.map((d) => d.meaningfulness),
        borderColor: '#9333ea',
        backgroundColor: '#e9d5ff',
        tension: 0.3,
      },
    ],
  };

  // Calculate summary stats
  const moodCount: Record<string, number> = {};
  let highestMeaning = { day: '', value: 0 };
  let lowestEnergy = { day: '', value: 10 };

  data.forEach((d) => {
    moodCount[d.mood] = (moodCount[d.mood] || 0) + 1;

    if (d.meaningfulness > highestMeaning.value) {
      highestMeaning = {
        value: d.meaningfulness,
        day: new Date(d.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
      };
    }

    if (d.energy_level < lowestEnergy.value) {
      lowestEnergy = {
        value: d.energy_level,
        day: new Date(d.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
      };
    }
  });

  const mostCommonMood = Object.entries(moodCount).reduce(
    (acc, [mood, count]) => (count > acc.count ? { mood, count } : acc),
    { mood: '', count: 0 }
  );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📈 Weekly Trends</h1>

        {loading ? (
          <p>Loading...</p>
        ) : data.length === 0 ? (
          <p>No check-ins found for the past 7 days.</p>
        ) : (
          <>
            {/* Chart */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <Line data={chartData} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white shadow p-4 rounded-xl">
                <h2 className="text-sm text-gray-500">Total Check-Ins</h2>
                <p className="text-3xl font-semibold">{data.length}</p>
              </div>
              <div className="bg-white shadow p-4 rounded-xl">
                <h2 className="text-sm text-gray-500">Most Common Mood</h2>
                <p className="text-xl">{mostCommonMood.mood || 'N/A'} ({mostCommonMood.count})</p>
              </div>
              <div className="bg-white shadow p-4 rounded-xl">
                <h2 className="text-sm text-gray-500">Highest Meaningful Day</h2>
                <p className="text-xl">{highestMeaning.day} ({highestMeaning.value})</p>
              </div>
              <div className="bg-white shadow p-4 rounded-xl">
                <h2 className="text-sm text-gray-500">Lowest Energy Day</h2>
                <p className="text-xl">{lowestEnergy.day} ({lowestEnergy.value})</p>
              </div>
            </div>

            {/* Mood History */}
            <div className="bg-white p-4 rounded-xl shadow mb-6">
              <h2 className="font-semibold mb-2 text-sm text-gray-500">Mood Log</h2>
              <div className="flex flex-wrap gap-2 text-xl">
                {data.map((d, idx) => (
                  <span key={idx}>{d.mood}</span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link href="/summary">
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition">
                  🎨 View Weekly MoodBoard AI
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
