import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import LineChart from './components/LineChart';
import BarChart from './components/BarChart';
import RegionalMap from './components/RegionalMap';
import PatternHeatmap from './components/PatternHeatmap';
import { getStateKeys, normalizeRow } from './Utils';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [selectedSector, setSelectedSector] = useState<string>('Rural+Urban');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    fetch('/cleaned_dataset_final.csv')
      .then(r => r.text())
      .then(csv =>
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: r => {
            // Normalize month names/whitespace once, up front.
            const cleaned = (r.data as any[]).map(normalizeRow);
            setData(cleaned);
            setLoading(false);
          },
        })
      );
  }, []);

  const years = useMemo(() => {
    const ys = Array.from(new Set(data.map((row: any) => row.Year))).filter(Boolean);
    return ys.sort();
  }, [data]);

  // Default to the most recent year once data has loaded
  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => data.filter((row: any) => row.Year === selectedYear && row.Sector === selectedSector),
    [data, selectedYear, selectedSector]
  );

  const calculateAverage = (dataset: any[]) => {
    if (!dataset.length) return 0;
    const states = getStateKeys(dataset[0]);
    if (!states.length) return 0;

    let totalSum = 0;
    let totalCount = 0;
    dataset.forEach(row => {
      states.forEach(state => {
        const val = Number(row[state]);
        if (!isNaN(val) && val > 0) {
          totalSum += val;
          totalCount++;
        }
      });
    });
    return totalCount > 0 ? totalSum / totalCount : 0;
  };

  // Find the state with the highest average CPI for the current selection,
  // instead of a hardcoded "Maharashtra".
  const volatilityPeak = useMemo(() => {
    if (!filtered.length) return { state: '—', value: 0 };
    const states = getStateKeys(filtered[0]);
    let best = { state: '—', value: -Infinity };
    states.forEach(state => {
      const vals = filtered.map(r => Number(r[state])).filter(v => !isNaN(v) && v > 0);
      if (!vals.length) return;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg > best.value) best = { state, value: avg };
    });
    return best.value === -Infinity ? { state: '—', value: 0 } : best;
  }, [filtered]);

  const nationalAvg = calculateAverage(filtered).toFixed(1);
  const prevYear = (parseInt(selectedYear || '0') - 1).toString();
  const prevFiltered = data.filter((row: any) => row.Year === prevYear && row.Sector === selectedSector);
  const prevAvg = calculateAverage(prevFiltered);

  const yoyChange = prevAvg > 0
    ? (((parseFloat(nationalAvg) - prevAvg) / prevAvg) * 100).toFixed(1)
    : '0.0';

  const isPositiveYoY = parseFloat(yoyChange) >= 0;

  const sectorOptions = [
    { value: 'Rural+Urban', label: 'Rural + Urban' },
    { value: 'Urban', label: 'Urban' },
    { value: 'Rural', label: 'Rural' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-6 lg:p-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative overflow-x-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div>
            <span className="text-xs font-black tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent uppercase">Data Workspace</span>
            <h1 className="text-3xl font-black tracking-tight text-white mt-0.5">State Level Consumer Price Index</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-slate-900/60 border border-white/10 text-xs font-bold text-slate-200 outline-none cursor-pointer py-2.5 px-4 rounded-2xl hover:bg-white/10 hover:border-blue-400/30 transition-all backdrop-blur-xl"
            >
              {years.map(y => <option key={y} value={y} className="bg-slate-950 text-white">{y}</option>)}
            </select>

            <div className="bg-slate-900/60 p-1 border border-white/10 rounded-2xl flex gap-1 backdrop-blur-xl">
              {sectorOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSector(opt.value)}
                  className={`text-xs font-bold py-2 px-3 rounded-xl transition-all ${
                    selectedSector === opt.value
                      ? 'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading && (
          <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Loading dataset…</div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onMouseEnter={() => setHoveredCard(1)} onMouseLeave={() => setHoveredCard(null)}
            className={`p-6 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border transition-all duration-300 cursor-default ${hoveredCard === 1 ? 'border-blue-500/40 bg-white/[0.07] -translate-y-1 shadow-xl shadow-blue-500/10' : 'border-white/10'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">National CPI Average</span>
            <p className="text-5xl font-black text-white mt-4 tabular-nums">{nationalAvg}</p>
            <div className={`mt-3 inline-flex text-xs font-bold px-2.5 py-1 rounded-lg ${isPositiveYoY ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isPositiveYoY ? '▲' : '▼'} {Math.abs(parseFloat(yoyChange))}% YoY
            </div>
          </div>

          <div onMouseEnter={() => setHoveredCard(2)} onMouseLeave={() => setHoveredCard(null)}
            className={`p-6 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border transition-all duration-300 cursor-default ${hoveredCard === 2 ? 'border-amber-500/40 bg-white/[0.07] -translate-y-1 shadow-xl shadow-amber-500/10' : 'border-white/10'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volatility Peak</span>
            <p className="text-3xl font-black text-amber-400 mt-5 truncate">{volatilityPeak.state.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-400 mt-3">
              Highest sustained CPI {volatilityPeak.value > 0 ? `(${volatilityPeak.value.toFixed(1)})` : ''} for this selection
            </p>
          </div>

          <div onMouseEnter={() => setHoveredCard(3)} onMouseLeave={() => setHoveredCard(null)}
            className={`p-6 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border transition-all duration-300 cursor-default ${hoveredCard === 3 ? 'border-purple-500/40 bg-white/[0.07] -translate-y-1 shadow-xl shadow-purple-500/10' : 'border-white/10'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insight</span>
            <p className="text-sm text-slate-300 font-medium mt-4 leading-relaxed">
              {selectedSector} CPI for {selectedYear}: national average is {nationalAvg}, {isPositiveYoY ? 'up' : 'down'} {Math.abs(parseFloat(yoyChange))}% year-over-year.
            </p>
          </div>
        </section>

        {/* Charts Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2">📈 National Trend</h3>
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl min-h-[380px] relative">
              <LineChart data={data} year={selectedYear} sector={selectedSector} />
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2">📊 Top States</h3>
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl min-h-[380px]">
              <BarChart data={filtered} />
            </div>
          </div>

          <div className="lg:col-span-7 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2">🗺️ Regional Map</h3>
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl min-h-[380px]">
              <RegionalMap data={filtered} />
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2">🔥 Monthly Pattern Heatmap</h3>
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl min-h-[280px] overflow-x-auto">
              <PatternHeatmap data={data} year={selectedYear} currentSector={selectedSector} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;