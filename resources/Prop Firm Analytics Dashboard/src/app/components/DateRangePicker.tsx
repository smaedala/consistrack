import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';

interface DateRangePickerProps {
  onDateChange?: (startDate: Date, endDate: Date) => void;
}

export function DateRangePicker({ onDateChange }: DateRangePickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 Days');

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

  const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Month', 'Last Month', 'Custom'];

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    setIsOpen(false);

    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'Last 7 Days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 90 Days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last Month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
    }

    if (onDateChange && range !== 'Custom') {
      onDateChange(startDate, endDate);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
        style={{
          backgroundColor: c.bg,
          borderColor: c.border,
          color: c.text,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.bg}
      >
        <Calendar size={16} style={{ color: c.subText }} />
        <span className="text-sm">{selectedRange}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-lg border shadow-lg z-10 min-w-[180px]"
          style={{
            backgroundColor: c.bg,
            borderColor: c.border,
          }}
        >
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeSelect(range)}
              className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
              style={{
                color: selectedRange === range ? (theme === 'dark' ? '#00F2FE' : '#0EA5E9') : c.text,
                backgroundColor: selectedRange === range ? c.hover : 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
              onMouseLeave={(e) => {
                if (selectedRange !== range) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {range}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
