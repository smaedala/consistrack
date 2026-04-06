import { useTheme } from '../context/ThemeContext';
import { Trophy, Target, TrendingUp, Activity } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

interface TradingMetricsProps {
  data?: {
    winRate: number;
    riskReward: number;
    profitFactor: number;
    totalTrades: number;
  };
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
      className="rounded-lg p-4 border dash-hover-card"
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

export function TradingMetrics({ data }: TradingMetricsProps) {
  const { theme } = useTheme();
  const iconColor = theme === 'dark' ? '#00F2FE' : '#0EA5E9';
  const winRate = Number.isFinite(data?.winRate) ? data!.winRate : 0;
  const riskReward = Number.isFinite(data?.riskReward) ? data!.riskReward : 0;
  const profitFactor = Number.isFinite(data?.profitFactor) ? data!.profitFactor : 0;
  const totalTrades = Number.isFinite(data?.totalTrades) ? data!.totalTrades : 0;

  return (
    <div className="dashboard-metrics-row">
      <MetricCard
        icon={<Trophy size={20} style={{ color: iconColor }} />}
        label="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        isPositive={true}
      />
      <MetricCard
        icon={<Target size={20} style={{ color: iconColor }} />}
        label="Risk/Reward Ratio"
        value={`1:${riskReward.toFixed(2)}`}
        isPositive={true}
      />
      <MetricCard
        icon={<TrendingUp size={20} style={{ color: iconColor }} />}
        label="Profit Factor"
        value={profitFactor.toFixed(2)}
        isPositive={true}
      />
      <MetricCard
        icon={<Activity size={20} style={{ color: iconColor }} />}
        label="Total Trades"
        value={String(totalTrades)}
        isPositive={true}
      />
    </div>
  );
}
