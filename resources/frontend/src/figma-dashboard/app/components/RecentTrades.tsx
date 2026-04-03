import { useMemo, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('All Symbols');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

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
  const symbols = useMemo(
    () => ['All Symbols', ...Array.from(new Set(mockTrades.map((trade) => trade.symbol)))],
    []
  );

  const filteredTrades = useMemo(() => {
    return mockTrades.filter((trade) => {
      const q = query.trim().toLowerCase();
      const queryMatch =
        q.length === 0 ||
        trade.symbol.toLowerCase().includes(q) ||
        trade.type.toLowerCase().includes(q);

      const symbolMatch = symbolFilter === 'All Symbols' || trade.symbol === symbolFilter;
      const typeMatch = typeFilter === 'ALL' || trade.type === typeFilter;
      const pnlMatch =
        pnlFilter === 'ALL' ||
        (pnlFilter === 'POSITIVE' && trade.pnl >= 0) ||
        (pnlFilter === 'NEGATIVE' && trade.pnl < 0);

      return queryMatch && symbolMatch && typeMatch && pnlMatch;
    });
  }, [query, symbolFilter, typeFilter, pnlFilter]);

  const hasFilters =
    query.trim().length > 0 ||
    symbolFilter !== 'All Symbols' ||
    typeFilter !== 'ALL' ||
    pnlFilter !== 'ALL';

  const clearFilters = () => {
    setQuery('');
    setSymbolFilter('All Symbols');
    setTypeFilter('ALL');
    setPnlFilter('ALL');
  };

  return (
    <div 
      className="rounded-lg p-6 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg" style={{ color: c.text }}>Recent Trades</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border min-w-[190px] shadow-sm"
              style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}
            >
              <Search size={14} style={{ color: c.subText }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol/type"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: c.text }}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}>
              <Filter size={14} style={{ color: c.subText }} />
              <select
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="bg-transparent outline-none text-sm pr-1"
                style={{ color: c.text }}
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol} style={{ color: '#000' }}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'BUY' | 'SELL')}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB', color: c.text }}
            >
              <option value="ALL">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <select
              value={pnlFilter}
              onChange={(e) => setPnlFilter(e.target.value as 'ALL' | 'POSITIVE' | 'NEGATIVE')}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB', color: c.text }}
            >
              <option value="ALL">All P&L</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Negative</option>
            </select>
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
                style={{ borderColor: c.border, color: c.subText, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}
              >
                <X size={14} />
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <p className="text-xs" style={{ color: c.subText }}>
          Showing {filteredTrades.length} of {mockTrades.length} trades
        </p>
      </div>

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
            {filteredTrades.map((trade) => (
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
            {filteredTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-sm text-center"
                  style={{ color: c.subText }}
                >
                  No trades match your current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
