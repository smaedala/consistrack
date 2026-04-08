import { CircleHelp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface ConsistencyMeterProps {
  percentage: number;
  threshold?: number;
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
      <CircleHelp size={14} />
    </span>
  );
}

export function ConsistencyMeter({ percentage, threshold = 40, helpMode = false }: ConsistencyMeterProps) {
  const { theme } = useTheme();
  const dangerThreshold = threshold;
  const isSafe = percentage < dangerThreshold;
  const visualPercentage = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  const rounded = Number.isFinite(percentage) ? Number(percentage.toFixed(1)) : 0;
  const displayPercent = Number.isInteger(rounded) ? `${Math.round(rounded)}%` : `${rounded.toFixed(1)}%`;
  const centerFontSize =
    displayPercent.length >= 7
      ? 'clamp(1.1rem, 2.4vw, 1.8rem)'
      : displayPercent.length >= 6
      ? 'clamp(1.2rem, 2.7vw, 2rem)'
      : 'clamp(1.35rem, 3vw, 2.2rem)';

  const data = [
    { name: 'Used', value: visualPercentage },
    { name: 'Remaining', value: 100 - visualPercentage },
  ];

  const colors = {
    dark: {
      bg: '#1E2025',
      border: '#2A2D35',
      text: '#FFFFFF',
      subText: '#9CA3AF',
      cardBg: '#0D0F14',
      remaining: '#2A2D35',
    },
    light: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      subText: '#6B7280',
      cardBg: '#F9FAFB',
      remaining: '#E5E7EB',
    },
  };

  const c = colors[theme];

  const COLORS = {
    used: isSafe ? '#10B981' : percentage < 35 ? '#F59E0B' : '#EF4444',
    remaining: c.remaining,
  };

  return (
    <div
      className="rounded-lg p-6 border h-full dash-hover-card dashboard-surface"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        boxShadow: helpMode ? '0 0 0 1px rgba(0,242,254,0.30), 0 0 18px rgba(0,242,254,0.10)' : 'none',
      }}
    >
      <h3 className="text-lg mb-4 inline-flex items-center" style={{ color: c.text }}>
        Consistency Meter
        <Hint
          color={c.subText}
          helpMode={helpMode}
          text="Shows how much your highest 24h profit day contributes to total profit."
        />
      </h3>
      <p className="text-sm mb-6 inline-flex items-center" style={{ color: c.subText }}>
        Highest 24h Day vs Total Profit ({dangerThreshold}% Rule)
        <Hint
          color={c.subText}
          helpMode={helpMode}
          text="If this value reaches your threshold, you enter consistency breach risk."
        />
      </p>

      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? COLORS.used : COLORS.remaining}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span
            className="font-bold leading-none tabular-nums whitespace-nowrap text-center"
            style={{
              color: c.text,
              fontSize: centerFontSize,
              maxWidth: '62%',
            }}
          >
            {displayPercent}
          </span>
          <span className="text-sm mt-1" style={{ color: c.subText }}>
            of Total
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS.used }}
        ></span>
        <span
          className="text-sm font-medium"
          style={{ color: COLORS.used }}
        >
          {isSafe ? 'Safe' : percentage < 35 ? 'Warning' : 'Danger'}
        </span>
      </div>

      {/* Danger Line Indicator */}
      <div
        className="mt-4 p-3 rounded-lg border"
        style={{ backgroundColor: c.cardBg, borderColor: c.border }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: c.subText }}>
            Danger Threshold
            <Hint
              color={c.subText}
              helpMode={helpMode}
              text="Your configured consistency limit from onboarding or risk settings."
            />
          </span>
          <span className="text-sm font-medium" style={{ color: '#EF4444' }}>
            {dangerThreshold}%
          </span>
        </div>
      </div>
    </div>
  );
}
