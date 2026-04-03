import { useTheme } from '../context/ThemeContext';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  pnl: number;
}

const mockTrades: Trade[] = [
  { id: '1', symbol: 'EUR/USD', type: 'BUY', lotSize: 0.5, pnl: 450.25 },
  { id: '2', symbol: 'GBP/USD', type: 'SELL', lotSize: 0.3, pnl: -120.50 },
  { id: '3', symbol: 'USD/JPY', type: 'BUY', lotSize: 1.0, pnl: 680.00 },
  { id: '4', symbol: 'AUD/USD', type: 'SELL', lotSize: 0.2, pnl: 215.75 },
  { id: '5', symbol: 'EUR/GBP', type: 'BUY', lotSize: 0.4, pnl: -95.30 },
  { id: '6', symbol: 'USD/CHF', type: 'BUY', lotSize: 0.6, pnl: 340.60 },
  { id: '7', symbol: 'NZD/USD', type: 'SELL', lotSize: 0.3, pnl: 185.20 },
  { id: '8', symbol: 'EUR/JPY', type: 'BUY', lotSize: 0.5, pnl: 520.40 },
];

export function RecentTrades() {
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

  return (
    <div 
      className="rounded-lg p-6 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <h3 className="text-lg mb-4" style={{ color: c.text }}>Recent Trades</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
              <th className="text-left text-sm font-medium pb-3" style={{ color: c.subText }}>Symbol</th>
              <th className="text-left text-sm font-medium pb-3" style={{ color: c.subText }}>Type</th>
              <th className="text-right text-sm font-medium pb-3" style={{ color: c.subText }}>Lot Size</th>
              <th className="text-right text-sm font-medium pb-3" style={{ color: c.subText }}>P&L</th>
            </tr>
          </thead>
          <tbody>
            {mockTrades.map((trade) => (
              <tr 
                key={trade.id} 
                className="transition-colors"
                style={{ borderBottom: `1px solid ${c.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td className="py-3 text-sm" style={{ color: c.text }}>{trade.symbol}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}
                  >
                    {trade.type}
                  </span>
                </td>
                <td className="py-3 text-right text-sm" style={{ color: c.text }}>{trade.lotSize.toFixed(2)}</td>
                <td
                  className={`py-3 text-right text-sm font-medium ${
                    trade.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {trade.pnl >= 0 ? '+' : ''}€{trade.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}