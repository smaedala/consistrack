import { useState } from 'react';
import { Filter, TrendingUp, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DateRangePicker } from './DateRangePicker';

export function FilterBar() {
  const { theme } = useTheme();
  const [selectedSymbol, setSelectedSymbol] = useState('All Symbols');
  const [isSymbolOpen, setIsSymbolOpen] = useState(false);

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      hover: '#2A2D35',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      hover: '#F3F4F6',
    },
  };

  const c = colors[theme];

  const symbols = [
    'All Symbols',
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'AUD/USD',
    'EUR/GBP',
    'USD/CHF',
  ];

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-semibold" style={{ color: c.text }}>
          Trading Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: c.subText }}>
          Monitor your trading performance and risk metrics
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Symbol Filter */}
        <div className="relative">
          <button
            onClick={() => setIsSymbolOpen(!isSymbolOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: c.bg,
              borderColor: c.border,
              color: c.text,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.bg}
          >
            <Filter size={16} style={{ color: c.subText }} />
            <span className="text-sm">{selectedSymbol}</span>
          </button>

          {isSymbolOpen && (
            <div
              className="absolute right-0 mt-2 rounded-lg border shadow-lg z-10 min-w-[160px]"
              style={{
                backgroundColor: c.bg,
                borderColor: c.border,
              }}
            >
              {symbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => {
                    setSelectedSymbol(symbol);
                    setIsSymbolOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
                  style={{
                    color: selectedSymbol === symbol ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.text,
                    backgroundColor: selectedSymbol === symbol ? c.hover : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
                  onMouseLeave={(e) => {
                    if (selectedSymbol !== symbol) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        <DateRangePicker />

        {/* Export Button */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
          style={{
            backgroundColor: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
            borderColor: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Download size={16} />
          <span className="text-sm">Export</span>
        </button>
      </div>
    </div>
  );
}
