import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CircleHelp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface WinLossItem {
  day: string;
  wins: number;
  losses: number;
}

interface WinLossDistributionProps {
  data?: WinLossItem[];
  accountId?: number | null;
  refreshKey?: number;
  days?: number;
  helpMode?: boolean;
}

function Hint({ text, color, helpMode = false }: { text: string; color: string; helpMode?: boolean }) {
  return (
    <span
      className="inline-flex items-center ml-1 align-middle cursor-help"
      title={text}
      aria-label={text}
      style={{
        color: helpMode ? '#00F2FE' : color,
        opacity: 0.85,
        filter: helpMode ? 'drop-shadow(0 0 6px rgba(0,242,254,0.45))' : 'none',
      }}
    >
      <CircleHelp size={13} />
    </span>
  );
}

export function WinLossDistribution({ data = [], accountId = null, refreshKey = 0, days = 5, helpMode = false }: WinLossDistributionProps) {
  const { theme } = useTheme();
  const [liveData, setLiveData] = useState<WinLossItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      grid: '#2A2D35',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      grid: '#E5E7EB',
    },
  };

  const c = colors[theme];
  useEffect(() => {
    if (!accountId) {
      setLiveData([]);
      setError(null);
      return;
    }

    let active = true;
    const fetchLive = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/accounts/${accountId}/dashboard/win-loss-distribution`, {
          params: { days },
        });
        if (!active) return;
        const series = Array.isArray(res.data?.data?.series) ? res.data.data.series : [];
        setLiveData(series);
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load Win/Loss data');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLive();
    const timer = window.setInterval(fetchLive, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [accountId, refreshKey, days]);

  const sourceRows = useMemo(() => {
    if (liveData.length > 0) return liveData;
    if (data.length > 0) return data;
    return [{ day: 'Day 1', wins: 0, losses: 0 }];
  }, [liveData, data]);

  const rows = sourceRows;
  const totalWins = rows.reduce((sum, day) => sum + day.wins, 0);
  const totalLosses = rows.reduce((sum, day) => sum + day.losses, 0);
  const total = Math.max(totalWins + totalLosses, 1);
  const winPercent = Math.round((totalWins / total) * 100);
  const lossPercent = 100 - winPercent;
  const pieData = [
    { name: 'Wins', value: totalWins, color: '#10B981' },
    { name: 'Losses', value: totalLosses, color: '#EF4444' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg p-3 border shadow-lg"
          style={{ backgroundColor: c.bg, borderColor: c.border }}
        >
          <p className="text-sm mb-2" style={{ color: c.text }}>{payload[0].payload.day}</p>
          <p className="text-xs" style={{ color: '#10B981' }}>
            Wins: {payload[0].value}
          </p>
          <p className="text-xs" style={{ color: '#EF4444' }}>
            Losses: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="rounded-lg p-4 sm:p-6 border dashboard-equal-height-card h-full flex flex-col winloss-card"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        boxShadow: helpMode ? '0 0 0 1px rgba(0,242,254,0.30), 0 0 18px rgba(0,242,254,0.10)' : 'none',
      }}
    >
      <h3 className="text-lg mb-4 inline-flex items-center" style={{ color: c.text }}>
        Win/Loss Distribution
        <Hint
          color={c.subText}
          helpMode={helpMode}
          text="Top chart compares win vs loss counts by day. Donut shows overall win-rate mix."
        />
      </h3>
      <p className="text-xs mb-2" style={{ color: error ? '#EF4444' : c.subText }}>
        {loading ? 'Syncing live data...' : (error || `Last ${days} trading days`)}
      </p>

      <div className="flex-1 min-h-0 grid grid-rows-[1fr_1fr] gap-4 winloss-card-grid">
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="day" stroke={c.subText} style={{ fontSize: '12px' }} />
              <YAxis stroke={c.subText} style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: c.grid, opacity: 0.3 }} />
              <Bar dataKey="wins" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="pt-4 border-t min-h-0 flex flex-col winloss-card-donut-section"
          style={{ borderColor: c.border }}
        >
          <div className="flex items-center justify-center gap-4 mb-2 winloss-card-badges">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.14)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
            <span className="text-xs font-semibold" style={{ color: '#10B981' }}>WIN {winPercent}%</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.14)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
            <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>LOSS {lossPercent}%</span>
          </div>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-[280px] winloss-card-donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={0}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-semibold" style={{ color: c.text }}>{winPercent}%</span>
                <span className="text-xs" style={{ color: c.subText }}>Win Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
