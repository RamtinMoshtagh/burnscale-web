// app/components/TrendsCard.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Props {
  data: { date: string; energy: number; meaning: number }[];
}

export default function TrendsCard({ data }: Props) {
  if (!data.length) return null;

  const categories = data.map((d) => d.date);
  const energy = data.map((d) => d.energy);
  const meaning = data.map((d) => d.meaning);

  const options: ApexOptions = {
    chart: { id: 'trend-chart', toolbar: { show: false }, zoom: { enabled: false } },
    xaxis: { categories, labels: { rotate: -45 } },
    yaxis: {
      min: 0,
      max: 10,
      title: { text: 'Score (0–10)' },
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#60A5FA', '#F59E0B'],
    tooltip: { theme: 'dark', shared: true },
  };

  return (
    <div className="bg-surface rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-semibold text-onSurface mb-4">📊 Energy & Meaningfulness</h2>
      <ReactApexChart
        options={options}
        series={[{ name: 'Energy', data: energy }, { name: 'Meaning', data: meaning }]}
        type="line"
        height={300}
      />
    </div>
  );
}

