import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

// Mock data for equity curve
const generateEquityData = () => {
  const data = [];
  let equity = 100000;
  const days = 30;

  for (let i = 0; i < days; i++) {
    const change = Math.random() * 1000 - 200; // Some days gain, some lose
    equity += change;
    data.push({
      day: `Day ${i + 1}`,
      equity: Math.round(equity * 100) / 100,
    });
  }

  return data;
};

const equityData = generateEquityData();

export function EquityCurveChart() {
  const { theme } = useTheme();

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      grid: '#2A2D35',
      tooltipBg: '#0D0F14',
      accent: '#00F2FE',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      grid: '#E5E7EB',
      tooltipBg: '#FFFFFF',
      accent: '#0EA5E9',
    },
  };

  const c = colors[theme];

  return (
    <div 
      className="rounded-lg p-6 border dash-hover-card"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Equity Curve</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={equityData}>
          <defs>
            <linearGradient id={`equityGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="day"
            stroke={c.subText}
            tick={{ fill: c.subText, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={c.subText}
            tick={{ fill: c.subText, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: c.subText, fontSize: '12px' }}
            itemStyle={{ color: c.accent, fontSize: '14px' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={c.accent}
            strokeWidth={2}
            fill={`url(#equityGradient-${theme})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
