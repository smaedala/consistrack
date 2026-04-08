import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CalendarDay {
  date: string;
  day: number;
  in_current_month: boolean;
  trades: number;
  pnl: number;
  status: 'profit' | 'loss' | 'no_trades';
}

interface CalendarPayload {
  month: string;
  month_label: string;
  week_days: string[];
  days: CalendarDay[];
  summary: {
    total_trades: number;
    total_pnl: number;
    profitable_days: number;
    losing_days: number;
    no_trade_days: number;
  };
}

interface TradingCalendarProps {
  accountId: number | null;
  refreshKey?: number;
  helpMode?: boolean;
}

function Hint({ text, color, helpMode = false }: { text: string; color: string; helpMode?: boolean }) {
  return (
    <span
      className="inline-flex items-center ml-1 align-middle cursor-help"
      title={text}
      aria-label={text}
      style={{
        color: helpMode ? '#00F2FE' : color,
        opacity: 0.85,
        filter: helpMode ? 'drop-shadow(0 0 6px rgba(0,242,254,0.45))' : 'none',
      }}
    >
      <CircleHelp size={13} />
    </span>
  );
}

function shiftMonth(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const m = Number(monthStr);
  const d = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function TradingCalendar({ accountId, refreshKey = 0, helpMode = false }: TradingCalendarProps) {
  const { theme } = useTheme();
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [payload, setPayload] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      dayBg: '#0D0F14',
      inactiveDay: '#151821',
      buttonBg: '#121724',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      dayBg: '#F9FAFB',
      inactiveDay: '#F3F4F6',
      buttonBg: '#F9FAFB',
    },
  };

  const c = colors[theme];

  useEffect(() => {
    if (!accountId) {
      setPayload(null);
      setError(null);
      return;
    }

    let active = true;
    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/accounts/${accountId}/dashboard/trading-activity`, {
          params: { month },
        });
        if (!active) return;
        setPayload(res.data?.data ?? null);
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load trading activity calendar');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCalendar();
    const timer = window.setInterval(fetchCalendar, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [accountId, month, refreshKey]);

  const weekDays = payload?.week_days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = payload?.days ?? [];

  const legend = useMemo(
    () => ({
      profit: '#10B981',
      loss: '#EF4444',
      neutral: c.dayBg,
    }),
    [c.dayBg]
  );

  const getCellBg = (day: CalendarDay) => {
    if (!day.in_current_month) return c.inactiveDay;
    if (day.status === 'no_trades') return c.dayBg;
    if (day.status === 'loss') return day.pnl < -500 ? '#EF4444' : '#F87171';
    if (day.pnl > 1000) return '#10B981';
    if (day.pnl > 300) return '#34D399';
    return '#6EE7B7';
  };

  return (
    <div
      className="rounded-lg p-4 sm:p-6 border w-full min-w-0 dash-hover-card"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        boxShadow: helpMode ? '0 0 0 1px rgba(0,242,254,0.30), 0 0 18px rgba(0,242,254,0.10)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg inline-flex items-center" style={{ color: c.text }}>
          Trading Activity Calendar
          <Hint
            color={c.subText}
            helpMode={helpMode}
            text="Each day cell shows trade activity and net PnL. Hover a day to see details."
          />
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border"
            style={{ borderColor: c.border, backgroundColor: c.buttonBg, color: c.subText }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm min-w-[90px] text-center" style={{ color: c.subText }}>
            {payload?.month_label ?? month}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border"
            style={{ borderColor: c.border, backgroundColor: c.buttonBg, color: c.subText }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] sm:text-xs py-1" style={{ color: c.subText }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((dayData) => (
          <div
            key={dayData.date}
            className="aspect-square rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative group min-w-0"
            style={{
              backgroundColor: getCellBg(dayData),
              opacity: dayData.in_current_month ? 1 : 0.35,
            }}
            onMouseEnter={(e) => {
              if (dayData.in_current_month) {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${getCellBg(dayData)}40`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span className="text-[10px] sm:text-xs font-medium" style={{ color: dayData.status === 'no_trades' ? c.text : '#FFFFFF' }}>
              {dayData.day}
            </span>
            {dayData.trades > 0 ? (
              <span className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: '#FFFFFF', opacity: 0.85 }}>
                {dayData.trades}
              </span>
            ) : null}

            <div
              className="absolute bottom-full mb-2 hidden group-hover:block z-10 px-2 py-1 rounded text-xs whitespace-nowrap"
              style={{
                backgroundColor: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
              }}
            >
              <div className="font-medium">{dayData.trades} trades</div>
              <div style={{ color: dayData.pnl >= 0 ? '#10B981' : '#EF4444' }}>
                {dayData.pnl >= 0 ? '+' : ''}${Number(dayData.pnl || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 text-xs" style={{ color: c.subText }}>
        <span>{loading ? 'Syncing live data...' : error ? error : `${payload?.summary?.total_trades ?? 0} trades this month`}</span>
        <span style={{ color: (payload?.summary?.total_pnl ?? 0) >= 0 ? '#10B981' : '#EF4444' }}>
          {(payload?.summary?.total_pnl ?? 0) >= 0 ? '+' : ''}${Number(payload?.summary?.total_pnl ?? 0).toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: legend.loss }}></div>
          <span className="text-xs" style={{ color: c.subText }}>Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: legend.neutral }}></div>
          <span className="text-xs" style={{ color: c.subText }}>No trades</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: legend.profit }}></div>
          <span className="text-xs" style={{ color: c.subText }}>Profit</span>
        </div>
      </div>
    </div>
  );
}
