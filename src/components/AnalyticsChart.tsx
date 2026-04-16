import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export type ChartDataPoint = {
  date: string;
  count: number;
};

interface AnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
}

export const AnalyticsChart = ({ title, data }: AnalyticsChartProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="mt-8 border-t border-[var(--color-border)] pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[12px] font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2">
          <span>📊</span> Analytics
        </h3>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-bold py-1.5 px-3 rounded-full transition-colors active:scale-95 shadow-sm"
        >
          {isVisible ? 'Hide Graph' : 'Show Graph'}
        </button>
      </div>

      {isVisible && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-sm font-bold text-[var(--color-text-main)] mb-6 text-center">{title}</h4>
          
          {data.length === 0 || data.every(d => d.count === 0) ? (
            <div className="h-[250px] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
              No data available
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    margin={{ top: 10 }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => Math.floor(val).toString()}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--color-text-main)'
                    }}
                    itemStyle={{ color: '#22C55E' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Completed"
                    stroke="#22C55E"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGreen)"
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#22C55E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
