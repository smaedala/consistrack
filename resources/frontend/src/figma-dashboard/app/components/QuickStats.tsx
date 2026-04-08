import { useTheme } from '../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatItem({ label, value, trend, trendValue }: StatItemProps) {
  const { theme } = useTheme();

  const colors = {
    dark: {
      text: '#FFFFFF',
      subText: '#9CA3AF',
    },
    light: {
      text: '#000000',
      subText: '#6B7280',
    },
  };

  const c = colors[theme];

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight size={14} style={{ color: '#10B981' }} />;
    if (trend === 'down') return <ArrowDownRight size={14} style={{ color: '#EF4444' }} />;
    return <Minus size={14} style={{ color: c.subText }} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#10B981';
    if (trend === 'down') return '#EF4444';
    return c.subText;
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm" style={{ color: c.subText }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: c.text }}>{value}</span>
        {trendValue && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-xs" style={{ color: getTrendColor() }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickStatsData {
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  bestTradingDay: number;
  consecutiveWins: number;
  maxDrawdown: number;
}

interface QuickStatsProps {
  data?: QuickStatsData;
}

export function QuickStats({ data }: QuickStatsProps) {
  const { theme } = useTheme();

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
    },
  };

  const c = colors[theme];
  const stats: QuickStatsData = data ?? {
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    bestTradingDay: 0,
    consecutiveWins: 0,
    maxDrawdown: 0,
  };

  return (
    <div
      className="rounded-lg p-6 border dash-hover-card dashboard-surface"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Quick Statistics</h3>

      <div className="space-y-1 divide-y" style={{ borderColor: c.border }}>
        <StatItem label="Average Win" value={`$${stats.averageWin.toFixed(2)}`} trend={stats.averageWin > 0 ? 'up' : 'neutral'} />
        <StatItem label="Average Loss" value={`$${Math.abs(stats.averageLoss).toFixed(2)}`} trend={stats.averageLoss < 0 ? 'down' : 'neutral'} />
        <StatItem label="Largest Win" value={`$${stats.largestWin.toFixed(2)}`} trend={stats.largestWin > 0 ? 'up' : 'neutral'} />
        <StatItem label="Largest Loss" value={`$${Math.abs(stats.largestLoss).toFixed(2)}`} trend={stats.largestLoss < 0 ? 'down' : 'neutral'} />
        <StatItem label="Best Trading Day" value={`$${stats.bestTradingDay.toFixed(2)}`} trend={stats.bestTradingDay > 0 ? 'up' : 'neutral'} />
        <StatItem label="Consecutive Wins" value={`${stats.consecutiveWins} trades`} trend={stats.consecutiveWins > 0 ? 'up' : 'neutral'} />
        <StatItem label="Max Drawdown" value={`$${stats.maxDrawdown.toFixed(2)}`} trend={stats.maxDrawdown > 0 ? 'down' : 'neutral'} />
      </div>
    </div>
  );
}
