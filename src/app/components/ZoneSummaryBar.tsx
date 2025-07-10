// src/components/dashboard/ZoneSummaryBar.tsx
'use client';

import React from 'react';

interface Props {
  burnoutScores: number[];
}

const ZONES = [
  { label: 'Energized', color: '#14c97d', emoji: '🟢' },
  { label: 'Mild Stress', color: '#facc15', emoji: '🟡' },
  { label: 'Warning Zone', color: '#fb923c', emoji: '🟠' },
  { label: 'Burnout Zone', color: '#f43f5e', emoji: '🔴' },
  { label: 'Critical', color: '#27272a', emoji: '⚫' },
];

// Utility: Get quantile value from sorted array
const getQuantile = (sorted: number[], q: number): number => {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

export default function ZoneSummaryBar({ burnoutScores }: Props) {
  if (burnoutScores.length === 0) return null;

  const sorted = [...burnoutScores].sort((a, b) => a - b);
  const q20 = getQuantile(sorted, 0.2);
const q40 = getQuantile(sorted, 0.4);
const q60 = getQuantile(sorted, 0.6);
const q80 = getQuantile(sorted, 0.8);

const uniqueThresholds = new Set([q20, q40, q60, q80]);

// Fallback to fixed thresholds if all quantiles are equal
const thresholds = uniqueThresholds.size === 1
  ? [20, 40, 60, 80]
  : [q20, q40, q60, q80];

const getZoneLabel = (score: number): string => {
  if (score <= thresholds[0]) return 'Energized';
  if (score <= thresholds[1]) return 'Mild Stress';
  if (score <= thresholds[2]) return 'Warning Zone';
  if (score <= thresholds[3]) return 'Burnout Zone';
  return 'Critical';
};
console.log('Thresholds used:', thresholds);
console.log('Scores:', burnoutScores);


  const zoneCounts: Record<string, number> = {
    Energized: 0,
    'Mild Stress': 0,
    'Warning Zone': 0,
    'Burnout Zone': 0,
    Critical: 0,
  };

  burnoutScores.forEach((score) => {
    const zone = getZoneLabel(score);
    zoneCounts[zone]++;
  });

  const total = burnoutScores.length;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-semibold mb-4">📊 Burnout Zone Summary</h2>

      <div className="flex w-full h-6 overflow-hidden rounded-lg mb-4">
        {ZONES.map(({ label, color }) => {
          const count = zoneCounts[label] || 0;
          const percent = (count / total) * 100;

          return (
            <div
              key={label}
              style={{ width: `${percent}%`, backgroundColor: color }}
              className="h-full transition-all duration-300"
              title={`${label}: ${count} day${count !== 1 ? 's' : ''}`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-800">
        {ZONES.map(({ label, emoji }) => (
          <div key={label} className="flex items-center gap-2">
            <span>{emoji}</span>
            <span>
              {label}: {zoneCounts[label]} day{zoneCounts[label] !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

