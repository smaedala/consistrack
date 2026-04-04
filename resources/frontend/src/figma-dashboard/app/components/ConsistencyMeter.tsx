import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface ConsistencyMeterProps {
  percentage: number;
}

export function ConsistencyMeter({ percentage }: ConsistencyMeterProps) {
  const { theme } = useTheme();
  const dangerThreshold = 40;
  const isSafe = percentage < dangerThreshold;

  const data = [
    { name: 'Used', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      cardBg: '#0D0F14',
      remaining: '#2A2D35',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      cardBg: '#F9FAFB',
      remaining: '#E5E7EB',
    },
  };

  const c = colors[theme];

  const COLORS = {
    used: isSafe ? '#10B981' : percentage < 35 ? '#F59E0B' : '#EF4444',
    remaining: c.remaining,
  };

  return (
    <div
      className="rounded-lg p-6 border h-full dash-hover-card"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>
        Consistency Meter
      </h3>
      <p className="text-sm mb-6" style={{ color: c.subText }}>
        Max Day vs Total Profit (40% Rule)
      </p>

      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? COLORS.used : COLORS.remaining}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-4xl font-bold" style={{ color: c.text }}>
            {percentage}%
          </span>
          <span className="text-sm mt-1" style={{ color: c.subText }}>
            of Total
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS.used }}
        ></span>
        <span
          className="text-sm font-medium"
          style={{ color: COLORS.used }}
        >
          {isSafe ? 'Safe' : percentage < 35 ? 'Warning' : 'Danger'}
        </span>
      </div>

      {/* Danger Line Indicator */}
      <div
        className="mt-4 p-3 rounded-lg border"
        style={{ backgroundColor: c.cardBg, borderColor: c.border }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: c.subText }}>
            Danger Threshold
          </span>
          <span className="text-sm font-medium" style={{ color: '#EF4444' }}>
            40%
          </span>
        </div>
      </div>
    </div>
  );
}
