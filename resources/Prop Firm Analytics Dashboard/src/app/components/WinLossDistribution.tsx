import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const data = [
  { name: 'Mon', wins: 12, losses: 3 },
  { name: 'Tue', wins: 8, losses: 5 },
  { name: 'Wed', wins: 15, losses: 2 },
  { name: 'Thu', wins: 10, losses: 6 },
  { name: 'Fri', wins: 14, losses: 4 },
];

export function WinLossDistribution() {
  const { theme } = useTheme();

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg p-3 border shadow-lg"
          style={{ backgroundColor: c.bg, borderColor: c.border }}
        >
          <p className="text-sm mb-2" style={{ color: c.text }}>{payload[0].payload.name}</p>
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
      className="rounded-lg p-6 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Win/Loss Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="name" stroke={c.subText} style={{ fontSize: '12px' }} />
          <YAxis stroke={c.subText} style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: c.grid, opacity: 0.3 }} />
          <Bar dataKey="wins" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="losses" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
