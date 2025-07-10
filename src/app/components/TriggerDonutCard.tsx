// app/components/TriggerDonutCard.tsx
'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

/* ---------------------------------------------------- */
/*  Lazy-load ApexCharts & show a skeleton while loading */
/* ---------------------------------------------------- */
const ChartSkeleton = () => (
  <div className="h-80 w-full animate-pulse rounded-2xl bg-gray-100" />
);

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

/* ---------------------------------------------------- */
/*  Props                                               */
/* ---------------------------------------------------- */
export interface TriggerDonutCardProps {
  /** Trigger → count map */
  triggerCounts: Record<string, number>;
}

/* Colour palette (loops if > length) */
const PALETTE = [
  '#1C64F2', // blue
  '#16BDCA', // teal
  '#9061F9', // violet
  '#F87171', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // sky
  '#F472B6', // pink
  '#FBBF24', // yellow
  '#4ADE80', // green
];

/* ---------------------------------------------------- */
/*  Component                                           */
/* ---------------------------------------------------- */
function TriggerDonutCard({ triggerCounts }: TriggerDonutCardProps) {
  /* --------- transform once per prop change --------- */
  const { series, options } = useMemo(() => {
    const sorted = Object.entries(triggerCounts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return { series: [], options: {} };

    const labels = sorted.map(([l]) => l);
    const series = sorted.map(([, v]) => v);
    const total  = series.reduce((s, v) => s + v, 0);
    const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

    const opts: ApexOptions = {
      chart: { type: 'donut', height: 320, fontFamily: 'Inter, sans-serif' },
      labels,
      colors,
      stroke: { colors: ['transparent'] },
      dataLabels: {
        enabled: true,
        formatter: (_v, { seriesIndex }) => `${series[seriesIndex]}×`,
      },
      legend: {
        position: 'bottom',
        fontSize: '14px',
        formatter: (label, { seriesIndex }) => `${label}: ${series[seriesIndex]}×`,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '80%',
            labels: {
              show: true,
              total: {
                showAlways: true,
                label: 'Total',
                formatter: () => `${total} trigger${total !== 1 ? 's' : ''}`,
              },
            },
          },
        },
      },
      /* custom tooltip – no marker square */
      tooltip: {
        enabled: true,
        custom({ seriesIndex }) {
          return `<div style="background:#1F2937;color:#fff;padding:6px 8px;border-radius:4px;font-family:Inter,sans-serif;font-size:12px;">
                    ${labels[seriesIndex]}: <strong>${series[seriesIndex]}×</strong>
                  </div>`;
        },
      },
      responsive: [{ breakpoint: 768, options: { chart: { height: 260 } } }],
    };

    return { series, options: opts };
  }, [triggerCounts]);

  if (series.length === 0) return null;

  /* ---------------- UI ---------------- */
  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm"
      role="img"
      aria-label="Donut chart of stress-trigger distribution"
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        📌 Stress Triggers
      </h2>

      <ReactApexChart options={options} series={series} type="donut" height={320} />
    </div>
  );
}

export default React.memo(TriggerDonutCard);
