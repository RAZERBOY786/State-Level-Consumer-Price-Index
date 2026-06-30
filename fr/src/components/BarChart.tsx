import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { getStateKeys, formatStateName } from '../Utils';

interface BarChartProps {
  data: any[];
}

export default function BarChart({ data }: BarChartProps) {
  const topStates = useMemo(() => {
    if (!data.length) return [];
    const states = getStateKeys(data[0]);

    const averages = states.map(state => {
      const vals = data.map(row => Number(row[state])).filter(v => !isNaN(v) && v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { state, avg };
    });

    return averages
      .filter(s => s.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [data]);

  if (!topStates.length) {
    return <div className="text-slate-400 text-center py-24 text-sm">No data available for this selection</div>;
  }

  const chartData = {
    labels: topStates.map(s => formatStateName(s.state)),
    datasets: [{
      label: 'CPI Value',
      data: topStates.map(s => Number(s.avg.toFixed(1))),
      backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        ticks: { color: '#e2e8f0', font: { size: 12, weight: 600 as const } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full h-[380px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}