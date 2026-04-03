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

export function QuickStats() {
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

  return (
    <div
      className="rounded-lg p-6 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Quick Statistics</h3>

      <div className="space-y-1 divide-y" style={{ borderColor: c.border }}>
        <StatItem label="Average Win" value="€125.40" trend="up" trendValue="+8.2%" />
        <StatItem label="Average Loss" value="€88.20" trend="down" trendValue="-3.1%" />
        <StatItem label="Largest Win" value="€680.00" trend="up" trendValue="EUR/USD" />
        <StatItem label="Largest Loss" value="€120.50" trend="down" trendValue="GBP/USD" />
        <StatItem label="Avg Trade Duration" value="4.2 hours" trend="neutral" />
        <StatItem label="Best Trading Day" value="€1,245.80" trend="up" trendValue="Monday" />
        <StatItem label="Consecutive Wins" value="8 trades" trend="up" />
        <StatItem label="Max Drawdown" value="€850.00" trend="down" trendValue="-0.85%" />
      </div>
    </div>
  );
}
