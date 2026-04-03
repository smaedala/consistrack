import { useTheme } from '../context/ThemeContext';
import { Trophy, Target, TrendingUp, Activity } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

function MetricCard({ icon, label, value, change, isPositive }: MetricCardProps) {
  const { theme } = useTheme();

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
    },
  };

  const c = colors[theme];

  return (
    <div
      className="rounded-lg p-4 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: theme === 'dark' ? '#0D0F14' : '#F3F4F6' }}>
          {icon}
        </div>
        {change && (
          <span
            className="text-xs font-medium"
            style={{ color: isPositive ? '#10B981' : '#EF4444' }}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-xs mb-1" style={{ color: c.subText }}>{label}</p>
      <p className="text-xl font-semibold" style={{ color: c.text }}>{value}</p>
    </div>
  );
}

export function TradingMetrics() {
  const { theme } = useTheme();
  const iconColor = theme === 'dark' ? '#00F2FE' : '#0EA5E9';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={<Trophy size={20} style={{ color: iconColor }} />}
        label="Win Rate"
        value="64.5%"
        change="+2.3%"
        isPositive={true}
      />
      <MetricCard
        icon={<Target size={20} style={{ color: iconColor }} />}
        label="Risk/Reward Ratio"
        value="1:2.4"
        change="+0.2"
        isPositive={true}
      />
      <MetricCard
        icon={<TrendingUp size={20} style={{ color: iconColor }} />}
        label="Profit Factor"
        value="2.18"
        change="+0.15"
        isPositive={true}
      />
      <MetricCard
        icon={<Activity size={20} style={{ color: iconColor }} />}
        label="Total Trades"
        value="147"
        change="+12"
        isPositive={true}
      />
    </div>
  );
}
