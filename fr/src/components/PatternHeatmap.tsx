import React, { useMemo, useState } from 'react';
import { MONTHS, MONTH_SHORT, getStateKeys, formatStateName } from '../Utils';

interface PatternHeatmapProps {
  data: any[];
  year: string;
  currentSector: string;
}

const PatternHeatmap: React.FC<PatternHeatmapProps> = ({ data, year, currentSector }) => {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const filteredData = useMemo(
    () => data.filter(row => row.Sector === currentSector && row.Year === year),
    [data, currentSector, year]
  );

  const stateKeys = useMemo(() => {
    if (!filteredData.length) return [];
    return getStateKeys(filteredData[0]).slice(0, 12); // limit rows for display
  }, [filteredData]);

  const { heatmapData, maxValue } = useMemo(() => {
    const result: Record<string, number> = {};
    let max = 0;

    stateKeys.forEach(state => {
      MONTHS.forEach(month => {
        const monthData = filteredData.filter(row => row.Name === month);
        const vals = monthData.map(row => parseFloat(row[state])).filter(v => !isNaN(v) && v > 0);
        const value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        result[`${state}__${month}`] = Math.round(value * 10) / 10;
        if (value > max) max = value;
      });
    });

    return { heatmapData: result, maxValue: max || 1 };
  }, [filteredData, stateKeys]);

  const getColor = (value: number) => {
    if (!value) return 'hsl(220, 15%, 25%)';
    const intensity = Math.min(Math.max(value / maxValue, 0), 1);
    const hue = (1 - intensity) * 120; // 0 = red (high), 120 = green (low)
    return `hsl(${hue}, 75%, 50%)`;
  };

  if (!stateKeys.length) {
    return <div className="text-slate-400 text-center py-12">No data available for {currentSector} • {year}</div>;
  }

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex mb-4">
          <div className="w-40 flex-shrink-0"></div>
          <div className="flex flex-1 justify-between text-xs font-mono text-slate-400">
            {MONTHS.map(m => <div key={m} className="w-12 text-center">{MONTH_SHORT[m]}</div>)}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-1">
          {stateKeys.map(state => (
            <div key={state} className="flex items-center gap-4 text-sm">
              <div className="w-40 font-medium text-slate-300 truncate pr-2">
                {formatStateName(state)}
              </div>
              <div className="flex flex-1 gap-1">
                {MONTHS.map(month => {
                  const key = `${state}__${month}`;
                  const val = heatmapData[key] || 0;
                  const color = getColor(val);
                  const isActive = activeCell === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCell(isActive ? null : key)}
                      className={`w-12 h-8 rounded flex items-center justify-center text-[10px] font-mono border transition-all relative group ${
                        isActive ? 'border-white scale-110 z-10 shadow-lg' : 'border-white/10 hover:scale-110 hover:z-10'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`${formatStateName(state)} • ${month} ${year}: ${val || '—'}`}
                    >
                      <span className="text-white drop-shadow-sm">{val || '—'}</span>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 border border-white/10">
                        {formatStateName(state)} • {MONTH_SHORT[month]}: {val || '—'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-red-500 rounded"></div>
            <span>Higher CPI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-emerald-500 rounded"></div>
            <span>Lower CPI</span>
          </div>
          <div className="text-slate-400">• Monthly averages • {currentSector} • {year}</div>
        </div>
      </div>
    </div>
  );
};

export default PatternHeatmap;