import { useTheme } from '../context/ThemeContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SymbolPerformance {
  symbol: string;
  trades: number;
  winRate: number;
  pnl: number;
  avgWin: number;
  avgLoss: number;
}

interface PerformanceBySymbolProps {
  data?: SymbolPerformance[];
}

export function PerformanceBySymbol({ data = [] }: PerformanceBySymbolProps) {
  const { theme } = useTheme();

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      hover: '#0D0F14',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      hover: '#F9FAFB',
    },
  };

  const c = colors[theme];
  const rows = data;

  return (
    <div
      className="rounded-lg p-6 border dashboard-equal-height-card"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Performance by Symbol</h3>

      <div className="space-y-4">
        {rows.map((item) => (
          <div
            key={item.symbol}
            className="p-4 rounded-lg border transition-colors"
            style={{ backgroundColor: 'transparent', borderColor: c.border }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{ color: c.text }}>{item.symbol}</span>
                <span className="text-xs px-2 py-1 rounded" style={{
                  backgroundColor: item.pnl >= 0 ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  opacity: 0.9
                }}>
                  {item.trades} trades
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.pnl >= 0 ? (
                  <TrendingUp size={16} style={{ color: '#10B981' }} />
                ) : (
                  <TrendingDown size={16} style={{ color: '#EF4444' }} />
                )}
                <span
                  className="font-semibold"
                  style={{ color: item.pnl >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: c.subText }}>Win Rate</p>
                <p className="text-sm font-medium" style={{ color: c.text }}>{item.winRate}%</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: c.subText }}>Avg Win</p>
                <p className="text-sm font-medium" style={{ color: '#10B981' }}>${item.avgWin.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: c.subText }}>Avg Loss</p>
                <p className="text-sm font-medium" style={{ color: '#EF4444' }}>${item.avgLoss.toFixed(2)}</p>
              </div>
            </div>

            {/* Win Rate Bar */}
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.hover }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.winRate}%`,
                    backgroundColor: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="p-4 rounded-lg border text-sm" style={{ borderColor: c.border, color: c.subText }}>
            No symbol performance yet. Add trades to activate this panel.
          </div>
        ) : null}
      </div>
    </div>
  );
}
