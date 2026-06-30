import { useMemo, useState } from 'react';
import { IndiaMap } from '@vishalvoid/react-india-map';
import type { StateData } from '@vishalvoid/react-india-map';

interface MapProps {
  data: any[];
}

const STATE_ID_MAP: { [key: string]: string } = {
  'andhra pradesh': 'IN-AP', 'arunachal pradesh': 'IN-AR', 'assam': 'IN-AS',
  'bihar': 'IN-BR', 'chhattisgarh': 'IN-CT', 'delhi': 'IN-DL', 'goa': 'IN-GA',
  'gujarat': 'IN-GJ', 'haryana': 'IN-HR', 'himachal pradesh': 'IN-HP',
  'jharkhand': 'IN-JH', 'karnataka': 'IN-KA', 'kerala': 'IN-KL',
  'madhya pradesh': 'IN-MP', 'maharashtra': 'IN-MH', 'manipur': 'IN-MN',
  'meghalaya': 'IN-ML', 'mizoram': 'IN-MZ', 'nagaland': 'IN-NL',
  'odisha': 'IN-OR', 'orissa': 'IN-OR', 'punjab': 'IN-PB', 'rajasthan': 'IN-RJ',
  'sikkim': 'IN-SK', 'tamil nadu': 'IN-TN', 'telangana': 'IN-TG', 'tripura': 'IN-TR',
  'uttar pradesh': 'IN-UP', 'uttarakhand': 'IN-UT', 'west bengal': 'IN-WB',
  'andaman and nicobar': 'IN-AN', 'chandigarh': 'IN-CH',
  'dadra and nagar haveli': 'IN-DN', 'daman and diu': 'IN-DD',
  'jammu and kashmir': 'IN-JK', 'lakshadweep': 'IN-LD', 'puducherry': 'IN-PY'
};

export default function RegionalMap({ data }: MapProps) {
  const [hoveredState, setHoveredState] = useState<{ name: string; value: string } | null>(null);

  const { processedStates, minVal, maxVal, styleOverrides } = useMemo(() => {
    const averages: { [key: string]: number } = {};
    if (!data.length) return { processedStates: [], minVal: 100, maxVal: 160, styleOverrides: '' };

    const stateKeys = Object.keys(data[0]).filter(
      key => !['Year', 'Sector', 'Month', 'Date'].includes(key)
    );

    stateKeys.forEach(state => {
      let sum = 0;
      let count = 0;
      data.forEach(row => {
        const value = Number(row[state]);
        if (!isNaN(value) && value > 0) {
          sum += value;
          count++;
        }
      });
      const normalizedKey = state.toLowerCase().replace(/_/g, ' ').trim();
      averages[normalizedKey] = count > 0 ? sum / count : 0;
    });

    const values = Object.values(averages).filter(v => v > 0);
    const min = values.length ? Math.min(...values) : 100;
    const max = values.length ? Math.max(...values) : 160;

    const stateDataArray: StateData[] = [];
    let cssOverrides = '';

    Object.entries(averages).forEach(([name, val]) => {
      const isoId = STATE_ID_MAP[name];
      if (isoId && val > 0) {
        stateDataArray.push({
          id: isoId,
          customData: {
            name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            cpiValue: val.toFixed(1),
          },
        });

        // 🎨 DYNAMIC CHROMATIC OVERRIDE INJECTION
        // Computes linear color density percentage relative to the min/max variance spread
        const range = max - min;
        const normalizedWeight = range > 0 ? (val - min) / range : 0.5;

        // Map values continuously onto a high-contrast glass dark-mode gradient sequence
        let fillOpacity = 0.1; // Low fallback
        if (normalizedWeight > 0.8) fillOpacity = 0.85;       // Ultra Peak Index (Bright Blue Glow)
        else if (normalizedWeight > 0.6) fillOpacity = 0.65;  // High Index Corridor
        else if (normalizedWeight > 0.4) fillOpacity = 0.45;  // Mid Baseline Focus
        else if (normalizedWeight > 0.2) fillOpacity = 0.25;  // Moderated Zone
        else fillOpacity = 0.12;                              // Controlled Lower Bounds

        cssOverrides += `
          .india-map-container path#${isoId} {
            fill: rgba(59, 130, 246, ${fillOpacity}) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `;
      }
    });

    return { processedStates: stateDataArray, minVal: min, maxVal: max, styleOverrides: cssOverrides };
  }, [data]);

  const mapStyle = {
    backgroundColor: 'transparent',
    hoverColor: 'rgba(59, 130, 246, 0.55)',
    stroke: 'rgba(255, 255, 255, 0.25)',
    strokeWidth: 1,
    tooltipConfig: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      textColor: '#f8fafc',
    },
  };

  if (!data.length) {
    return <div className="text-slate-400 text-center py-24">No data available</div>;
  }

  return (
    <div className="w-full flex flex-col items-center justify-between p-1 relative h-full">
      
      {/* 🛠️ Dynamic Bounds Alignment & Choropleth Shading Injection */}
      <style>{`
        .india-map-widescreen-frame {
          width: 100%;
          max-width: 940px;
          aspect-ratio: 3 / 4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          position: relative;
        }
        .india-map-container {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transform: translateX(-14px) scale(0.94); 
        }
        .india-map-container svg {
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          overflow: visible !important;
          padding: 10px !important; 
        }
        /* Base path values fall back smoothly */
        .india-map-container path {
          stroke: rgba(255, 255, 255, 0.2) !important;
          stroke-width: 1.2px !important;
        }
        /* High-density highlight tracking on user focus vectors */
        .india-map-container path:hover {
          fill: rgba(59, 130, 246, 0.95) !important;
          stroke: #ffffff !important;
          cursor: pointer;
          filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.5));
        }
        
        /* Apply calculated color codes */
        ${styleOverrides}
      `}</style>

      {/* Floating Tooltip Indicator */}
      {hoveredState && (
        <div className="absolute top-2 right-2 z-30 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 text-xs shadow-2xl pointer-events-none">
          <div className="font-bold text-white tracking-wide">{hoveredState.name}</div>
          <div className="text-blue-400 font-extrabold mt-0.5">CPI Score: {hoveredState.value}</div>
        </div>
      )}

      {/* Map Graphics Canvas */}
      <div className="w-full flex-1 flex items-center justify-center bg-slate-950/40 border border-white/5 rounded-2xl p-6 overflow-hidden shadow-inner">
        <div className="india-map-widescreen-frame">
          <IndiaMap
            mapStyle={mapStyle}
            stateData={processedStates}
            onStateHover={(state: any) => {
              if (state?.customData) {
                setHoveredState({
                  name: state.customData.name,
                  value: state.customData.cpiValue,
                });
              } else {
                setHoveredState(null);
              }
            }}
          />
        </div>
      </div>

      {/* Synchronized Gradient Bar Scale */}
      <div className="w-full max-w-xs mt-4 space-y-1.5 px-1">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500/15 via-blue-500/45 to-blue-500/85 border border-white/5 shadow-inner" />
        <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-500 uppercase">
          <span>Low CPI ({minVal.toFixed(1)})</span>
          <span>High CPI ({maxVal.toFixed(1)})</span>
        </div>
      </div>
    </div>
  );
}