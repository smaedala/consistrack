import { useState } from 'react';
import { Plus, Upload, ListChecks } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type LastImport = {
  batchUuid: string;
  importedCount: number;
  importedAt: string | null;
  status: string;
};

type FilterBarProps = {
  onAddTradeClick?: () => void;
  onImportClick?: () => void;
  lastImport?: LastImport | null;
  onUndoLatestImport?: () => void;
  undoingLatestImport?: boolean;
};

export function FilterBar({
  onAddTradeClick,
  onImportClick,
  lastImport = null,
  onUndoLatestImport,
  undoingLatestImport = false,
}: FilterBarProps) {
  const { theme } = useTheme();
  const [isImportantOpen, setIsImportantOpen] = useState(false);

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

  const importantChecklist = [
    'Daily Loss Remaining',
    'Consistency % vs Threshold',
    'Max Loss Buffer',
    'Today P&L vs Limit',
    'Trading Day Reset Time',
    'Open Risk Alerts',
  ];

  const lastImportText = (() => {
    if (!lastImport || lastImport.status !== 'completed') return null;
    const importedAt = lastImport.importedAt ? new Date(lastImport.importedAt).toLocaleString() : 'just now';
    return `${lastImport.importedCount} trades • ${importedAt}`;
  })();

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
        {/* Add Trade */}
        <button
          onClick={() => onAddTradeClick?.()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
          style={{
            backgroundColor: c.bg,
            borderColor: c.border,
            color: c.text,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.bg}
        >
          <Plus size={16} style={{ color: c.subText }} />
          <span className="text-sm">Add Trade</span>
        </button>

        {/* Import MT4/MT5 */}
        <button
          onClick={() => onImportClick?.()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
          style={{
            backgroundColor: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
            borderColor: theme === 'dark' ? '#00F2FE' : '#0EA5E9',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Upload size={16} />
          <span className="text-sm">Import MT4/MT5</span>
        </button>

        {/* Important Checklist */}
        <div className="relative">
          <button
            onClick={() => setIsImportantOpen(!isImportantOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: c.bg,
              borderColor: c.border,
              color: c.text,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.bg}
          >
            <ListChecks size={16} style={{ color: c.subText }} />
            <span className="text-sm">Important</span>
          </button>

          {isImportantOpen ? (
            <div
              className="absolute right-0 mt-2 rounded-lg border shadow-lg z-10 min-w-[220px] py-1"
              style={{
                backgroundColor: c.bg,
                borderColor: c.border,
              }}
            >
              {importantChecklist.map((item) => (
                <div
                  key={item}
                  className="px-4 py-2 text-sm"
                  style={{ color: c.text }}
                >
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>

      </div>

      {lastImportText ? (
        <div
          className="w-full flex items-center justify-end gap-2"
          style={{ marginTop: '-4px' }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{
              borderColor: c.border,
              backgroundColor: c.bg,
              color: c.subText,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
            <span className="text-xs sm:text-sm">Last Import: {lastImportText}</span>
            <button
              type="button"
              className="ml-1 text-xs sm:text-sm font-medium px-2 py-1 rounded-md border"
              style={{
                borderColor: 'rgba(239,68,68,0.45)',
                color: '#EF4444',
                backgroundColor: 'rgba(239,68,68,0.08)',
                opacity: undoingLatestImport ? 0.7 : 1,
              }}
              onClick={() => onUndoLatestImport?.()}
              disabled={undoingLatestImport}
            >
              {undoingLatestImport ? 'Undoing...' : 'Undo Last'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
