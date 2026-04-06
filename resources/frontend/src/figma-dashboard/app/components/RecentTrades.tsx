import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, Filter, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ApiTrade {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  lot_size: number;
  pnl: number;
}

interface RecentTradesProps {
  accountId: number | null;
  refreshKey?: number;
}

export function RecentTrades({ accountId, refreshKey = 0 }: RecentTradesProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('All Symbols');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [trades, setTrades] = useState<ApiTrade[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrades, setTotalTrades] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    () => ['All Symbols', ...Array.from(new Set(trades.map((trade) => trade.symbol)))],
    [trades]
  );

  const hasFilters =
    query.trim().length > 0 ||
    symbolFilter !== 'All Symbols' ||
    typeFilter !== 'ALL' ||
    pnlFilter !== 'ALL';

  useEffect(() => {
    setCurrentPage(1);
  }, [query, symbolFilter, typeFilter, pnlFilter, accountId]);

  useEffect(() => {
    if (!accountId) {
      setTrades([]);
      setTotalTrades(0);
      setTotalPages(1);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: PAGE_SIZE,
    };

    if (query.trim()) params.q = query.trim();
    if (symbolFilter !== 'All Symbols') params.symbol = symbolFilter;
    if (typeFilter !== 'ALL') params.type = typeFilter.toLowerCase();
    if (pnlFilter === 'POSITIVE') params.pnl = 'positive';
    if (pnlFilter === 'NEGATIVE') params.pnl = 'negative';

    axios
      .get(`/accounts/${accountId}/dashboard/recent-trades`, { params })
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data ?? {};
        setTrades(Array.isArray(payload.data) ? payload.data : []);
        setTotalTrades(Number(payload.total ?? 0));
        setTotalPages(Math.max(1, Number(payload.last_page ?? 1)));
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load recent trades');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accountId, query, symbolFilter, typeFilter, pnlFilter, currentPage, refreshKey]);

  const clearFilters = () => {
    setQuery('');
    setSymbolFilter('All Symbols');
    setTypeFilter('ALL');
    setPnlFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div
      className="rounded-lg p-4 sm:p-6 border w-full min-w-0 dash-hover-card"
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
          {loading ? 'Loading trades...' : `Showing ${trades.length} of ${totalTrades} trades`}
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
            {trades.map((trade) => (
              <tr
                key={trade.id}
                className="transition-colors"
                style={{ borderBottom: `1px solid ${c.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = c.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="py-3 text-sm" style={{ color: c.text }}>{trade.symbol}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'buy' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}
                  >
                    {trade.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 text-right text-sm" style={{ color: c.text }}>{Number(trade.lot_size || 0).toFixed(2)}</td>
                <td className={`py-3 text-right text-sm font-medium ${Number(trade.pnl) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {Number(trade.pnl) >= 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && (trades.length === 0 || !accountId) ? (
              <tr>
                <td colSpan={4} className="py-6 text-sm text-center" style={{ color: c.subText }}>
                  {!accountId ? 'No account yet. Complete setup and add your first trade.' : (error ?? 'No trades found.')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: `1px solid ${c.border}` }}>
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

