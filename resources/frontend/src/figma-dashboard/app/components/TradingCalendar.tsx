import { useTheme } from '../context/ThemeContext';

interface CalendarDay {
  day: number;
  trades: number;
  pnl: number;
  isCurrentMonth: boolean;
}

const generateCalendarData = (empty = false): CalendarDay[] => {
  const days: CalendarDay[] = [];

  // Previous month days
  for (let i = 28; i <= 31; i++) {
    days.push({ day: i, trades: 0, pnl: 0, isCurrentMonth: false });
  }

  // Current month days with mock data
  const mockPnl = empty
    ? new Array(30).fill(0)
    : [450, -120, 680, 215, -95, 340, 185, 520, 280, -75,
                   410, 195, -165, 525, 310, 445, -88, 390, 265, 510,
                   -145, 375, 420, 485, -92, 355, 490, 0, 0, 0];

  for (let i = 1; i <= 30; i++) {
    const pnl = mockPnl[i - 1];
    days.push({
      day: i,
      trades: pnl !== 0 ? Math.floor(Math.random() * 8) + 3 : 0,
      pnl,
      isCurrentMonth: true,
    });
  }

  return days;
};

interface TradingCalendarProps {
  empty?: boolean;
}

export function TradingCalendar({ empty = false }: TradingCalendarProps) {
  const { theme } = useTheme();
  const calendarDays = generateCalendarData(empty);

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      dayBg: '#0D0F14',
      inactiveDay: '#1E2025',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      dayBg: '#F9FAFB',
      inactiveDay: '#FFFFFF',
    },
  };

  const c = colors[theme];

  const getPnlColor = (pnl: number) => {
    if (pnl === 0) return c.dayBg;
    if (pnl > 400) return '#10B981';
    if (pnl > 200) return '#34D399';
    if (pnl > 0) return '#6EE7B7';
    if (pnl > -100) return '#FCA5A5';
    if (pnl > -200) return '#F87171';
    return '#EF4444';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div
      className="rounded-lg p-4 sm:p-6 border w-full min-w-0 dash-hover-card"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg" style={{ color: c.text }}>Trading Activity Calendar</h3>
        <span className="text-sm" style={{ color: c.subText }}>March 2026</span>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] sm:text-xs py-1" style={{ color: c.subText }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((dayData, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative group min-w-0"
            style={{
              backgroundColor: dayData.isCurrentMonth ? getPnlColor(dayData.pnl) : c.inactiveDay,
              opacity: dayData.isCurrentMonth ? 1 : 0.3,
            }}
            onMouseEnter={(e) => {
              if (dayData.isCurrentMonth && dayData.pnl !== 0) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${getPnlColor(dayData.pnl)}40`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              className="text-[10px] sm:text-xs font-medium"
              style={{ color: dayData.pnl !== 0 ? '#FFFFFF' : c.text }}
            >
              {dayData.day}
            </span>
            {dayData.trades > 0 && (
              <span
                className="text-[9px] sm:text-[10px] mt-0.5"
                style={{ color: '#FFFFFF', opacity: 0.8 }}
              >
                {dayData.trades}
              </span>
            )}

            {/* Tooltip */}
            {dayData.isCurrentMonth && dayData.pnl !== 0 && (
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
                  {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
          <span className="text-xs" style={{ color: c.subText }}>Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: c.dayBg }}></div>
          <span className="text-xs" style={{ color: c.subText }}>No trades</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
          <span className="text-xs" style={{ color: c.subText }}>Profit</span>
        </div>
      </div>
    </div>
  );
}
