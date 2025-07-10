// app/components/TriggerDonutCard.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Props {
  triggerCounts: { [trigger: string]: number };
}

export default function TriggerDonutCard({ triggerCounts }: Props) {
  const labels = Object.keys(triggerCounts);
  const values = Object.values(triggerCounts);
  const total = values.reduce((sum, v) => sum + v, 0);

  if (!values.length) return null;

  const options: ApexOptions = {
    chart: { type: 'donut' },
    labels,
    colors: ['#F87171', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'],
    legend: {
      position: 'bottom',
      fontSize: '14px',
      formatter: (label, opts) => `${label}: ${values[opts.seriesIndex]}x`,
    },
    dataLabels: {
      enabled: true,
      formatter: (_, opts) => `${values[opts.seriesIndex]}x`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => `${total} triggers`,
            },
          },
        },
      },
    },
  };

  return (
    <div className="bg-surface rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-semibold text-onSurface mb-4">📌 Stress Triggers</h2>
      <ReactApexChart options={options} series={values} type="donut" height={320} />
    </div>
  );
}