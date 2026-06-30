import React, { useMemo } from 'react';
import { 
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart, Legend 
} from 'recharts';
import { MONTHS, MONTH_SHORT, getStateKeys } from '../Utils';

interface LineChartProps {
  data: any[];
  year: string | number;
  sector: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, year, sector }) => {
  const { chartData, peak } = useMemo(() => {
    if (!data?.length) return { chartData: [], peak: null };

    // Normalize year to string for comparison
    const targetYear = String(year).trim();

    const filtered = data.filter(row => {
      return String(row.Year).trim() === targetYear && 
             String(row.Sector).trim().toLowerCase() === sector.toLowerCase();
    });

    if (!filtered.length) {
      return { chartData: [], peak: null };
    }

    const stateKeys = getStateKeys(filtered[0]);

    let globalPeak = { 
      state: '', 
      value: -Infinity as number, 
      month: '' 
    };

    const rows = MONTHS.map(month => {
      // More flexible month matching
      const monthData = filtered.filter(row => {
        const rowMonth = String(row.Name || row.Month || '').trim().toLowerCase();
        return rowMonth === month.toLowerCase();
      });

      let nationalAvg = 0;
      let highState = '';
      let highValue = -Infinity;
      let lowValue = Infinity;
      let allValues: number[] = [];

      if (monthData.length > 0) {
        stateKeys.forEach(state => {
          const vals = monthData
            .map(r => parseFloat(r[state]))
            .filter(v => !isNaN(v) && v > 0);

          if (vals.length > 0) {
            const stateAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
            allValues.push(...vals);

            if (stateAvg > highValue) {
              highValue = stateAvg;
              highState = state;
            }
            if (stateAvg < lowValue) lowValue = stateAvg;
          }
        });

        nationalAvg = allValues.length 
          ? allValues.reduce((a, b) => a + b, 0) / allValues.length 
          : 0;

        // Track global peak
        if (highValue > globalPeak.value) {
          globalPeak = { 
            state: highState, 
            value: highValue, 
            month: MONTH_SHORT[month] || month 
          };
        }
      }

      return {
        month: MONTH_SHORT[month] || month.slice(0, 3),
        nationalAvg: Math.round(nationalAvg * 10) / 10,
        highStateValue: highValue === -Infinity ? null : Math.round(highValue * 10) / 10,
        lowStateValue: lowValue === Infinity ? null : Math.round(lowValue * 10) / 10,
        highState, // kept for reference
      };
    });

    const finalPeak = globalPeak.value === -Infinity ? null : globalPeak;

    return { 
      chartData: rows, 
      peak: finalPeak 
    };
  }, [data, year, sector]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl text-sm min-w-[160px]">
          <p className="font-bold text-white mb-3 border-b border-slate-700 pb-2">
            {label} {year}
          </p>
          {payload.map((entry: any, i: number) => (
            entry.value != null && (
              <p key={i} className="flex justify-between gap-6 text-slate-300 py-0.5">
                <span>{entry.name}:</span>
                <span className="font-mono font-bold" style={{ color: entry.color }}>
                  {Number(entry.value).toFixed(1)}
                </span>
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  if (!chartData.length) {
    return (
      <div className="text-slate-400 text-center py-24">
        No data available for <span className="font-medium text-slate-300">{sector}</span> • {year}
      </div>
    );
  }

  return (
    <div className="w-full h-[380px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 20, right: 35, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorNational" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="2 3" stroke="#334155" opacity={0.65} />

          <XAxis 
            dataKey="month" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11.5 }}
            tickLine={{ stroke: '#475569' }}
          />

          <YAxis
            domain={['auto', 'auto']}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            label={{ 
              value: 'CPI Index', 
              angle: -90, 
              position: 'insideLeft', 
              fill: '#94a3b8',
              style: { textAnchor: 'middle' }
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area 
            type="natural" 
            dataKey="nationalAvg" 
            stroke="#60a5fa" 
            strokeWidth={3.5} 
            fill="url(#colorNational)" 
            name="National CPI" 
          />
          
          <Area 
            type="natural" 
            dataKey="highStateValue" 
            stroke="#f87171" 
            strokeWidth={2.2} 
            strokeDasharray="3 2" 
            fill="url(#colorHigh)" 
            name="Highest State Avg" 
            opacity={0.75}
          />
          
          <Line 
            type="natural" 
            dataKey="lowStateValue" 
            stroke="#4ade80" 
            strokeWidth={2.8} 
            dot={{ fill: '#4ade80', r: 3.8, strokeWidth: 2 }} 
            name="Lowest State Avg" 
            activeDot={{ r: 5 }}
          />

          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="rect" 
            wrapperStyle={{ 
              color: '#e2e8f0', 
              fontSize: '12.5px', 
              fontWeight: 500,
              paddingBottom: '10px'
            }} 
          />
        </ComposedChart>
      </ResponsiveContainer>

      {peak && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl px-4 py-3 text-xs max-w-[200px] shadow-xl">
          <div className="text-amber-400 font-medium flex items-center gap-2">📍 Peak Pressure</div>
          <div className="text-white mt-1.5 font-mono text-[17px] font-bold leading-tight">
            {peak.state.replace(/_/g, ' ')} • {peak.value.toFixed(1)}
          </div>
          <div className="text-slate-400 text-[10px] mt-1">
            in {peak.month} {year}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;