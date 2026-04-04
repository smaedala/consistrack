import { useEffect, useMemo, useState } from 'react';
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
  { id: '9', symbol: 'CAD/JPY', type: 'SELL', lotSize: 0.2, pnl: -64.30 },
  { id: '10', symbol: 'XAU/USD', type: 'BUY', lotSize: 0.1, pnl: 712.55 },
  { id: '11', symbol: 'US30', type: 'SELL', lotSize: 0.4, pnl: -210.10 },
  { id: '12', symbol: 'NAS100', type: 'BUY', lotSize: 0.3, pnl: 302.00 },
  { id: '13', symbol: 'EUR/USD', type: 'SELL', lotSize: 0.6, pnl: -48.00 },
  { id: '14', symbol: 'GBP/JPY', type: 'BUY', lotSize: 0.2, pnl: 156.45 },
  { id: '15', symbol: 'AUD/JPY', type: 'SELL', lotSize: 0.5, pnl: -92.75 },
  { id: '16', symbol: 'USD/CAD', type: 'BUY', lotSize: 0.7, pnl: 265.30 },
  { id: '17', symbol: 'EUR/AUD', type: 'BUY', lotSize: 0.2, pnl: 74.60 },
  { id: '18', symbol: 'GBP/USD', type: 'BUY', lotSize: 0.9, pnl: 428.90 },
  { id: '19', symbol: 'USD/JPY', type: 'SELL', lotSize: 0.4, pnl: -130.20 },
  { id: '20', symbol: 'XAG/USD', type: 'BUY', lotSize: 0.3, pnl: 191.15 },
];

export function RecentTrades() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('All Symbols');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

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

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTrades.slice(start, start + PAGE_SIZE);
  }, [filteredTrades, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, symbolFilter, typeFilter, pnlFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    setCurrentPage(1);
  };

  return (
    <div 
      className="rounded-lg p-4 sm:p-6 border w-full min-w-0"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg" style={{ color: c.text }}>Recent Trades</h3>
          <div className="w-full max-w-full flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm w-full lg:w-1/2"
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
            <div className="w-full lg:w-1/2 max-w-full overflow-x-auto sm:overflow-visible">
              <div className="flex items-center gap-1.5 flex-nowrap min-w-max sm:min-w-0 lg:justify-end">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border min-w-[122px] shrink-0" style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}>
                  <Filter size={14} style={{ color: c.subText }} />
                  <select
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    className="bg-transparent outline-none text-sm pr-1 w-full"
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
                  className="px-3 py-2 rounded-xl border text-sm min-w-[92px] shrink-0"
                  style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB', color: c.text }}
                >
                  <option value="ALL">All Types</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
                <select
                  value={pnlFilter}
                  onChange={(e) => setPnlFilter(e.target.value as 'ALL' | 'POSITIVE' | 'NEGATIVE')}
                  className="px-3 py-2 rounded-xl border text-sm min-w-[92px] shrink-0"
                  style={{ borderColor: c.border, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB', color: c.text }}
                >
                  <option value="ALL">All P&L</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEGATIVE">Negative</option>
                </select>
                {hasFilters ? (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors min-w-[70px] shrink-0"
                    style={{ borderColor: c.border, color: c.subText, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}
                  >
                    <X size={14} />
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs" style={{ color: c.subText }}>
          Showing {paginatedTrades.length} of {filteredTrades.length} filtered trades ({mockTrades.length} total)
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
            {paginatedTrades.map((trade) => (
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
            {paginatedTrades.length === 0 ? (
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

      <div
        className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderTop: `1px solid ${c.border}` }}
      >
        <p className="text-xs" style={{ color: c.subText }}>
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: c.border, color: c.text, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;
            const active = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 rounded-lg border text-xs font-semibold"
                style={{
                  borderColor: active ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.border,
                  color: active ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.text,
                  backgroundColor: active ? (theme === 'dark' ? 'rgba(0,242,254,0.12)' : 'rgba(14,165,233,0.12)') : (theme === 'dark' ? '#121724' : '#F9FAFB'),
                }}
              >
                {page}
              </button>
            );
          })}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: c.border, color: c.text, backgroundColor: theme === 'dark' ? '#121724' : '#F9FAFB' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
