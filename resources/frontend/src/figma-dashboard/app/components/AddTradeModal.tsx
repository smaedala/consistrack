import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

type AddTradeModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  theme: 'dark' | 'light';
};

type PreviewState = 'safe' | 'caution' | 'breach';

const STRATEGY_PRESETS = [
  'Silver Bullet',
  'Judas Swing',
  'London Open Reversal',
  'NY Session Continuation',
  'Liquidity Sweep Reversal',
  'Order Block Reclaim',
  'Fair Value Gap (FVG) Fill',
  'Breaker Block',
  'Mitigation Block',
  'Market Structure Shift (MSS)',
  'Power of 3 (PO3)',
  'Killzone Setup',
  'Range Expansion',
  'News Volatility Fade',
  'Trend Pullback Entry',
];

export function AddTradeModal({ open, onClose, onSaved, onNotify, theme }: AddTradeModalProps) {
  const [accountId, setAccountId] = useState<number | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    state: PreviewState;
    projected_consistency_percent: number;
    consistency_limit_percent: number;
    projected_max_day_profit: number;
    max_allowed_day_profit: number;
    remaining_before_breach: number;
    breach_over_amount: number;
    current_total_profit: number;
    projected_total_profit: number;
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    symbol: 'EURUSD',
    type: 'buy',
    lot_size: '0.10',
    pnl: '',
    close_time: new Date().toISOString().slice(0, 16),
  });
  const [strategySelection, setStrategySelection] = useState<string>('');
  const [customStrategy, setCustomStrategy] = useState<string>('');

  const palette = useMemo(
    () =>
      theme === 'dark'
        ? {
            overlay: 'rgba(4, 8, 16, 0.7)',
            card: '#1E2025',
            border: '#2A2D35',
            text: '#F4F7FB',
            subText: '#9CA3AF',
            fieldBg: '#151821',
            cyan: '#00F2FE',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
          }
        : {
            overlay: 'rgba(17, 24, 39, 0.35)',
            card: '#FFFFFF',
            border: '#E5E7EB',
            text: '#0F172A',
            subText: '#64748B',
            fieldBg: '#F8FAFC',
            cyan: '#0EA5E9',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
          },
    [theme]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;
    setLoadingAccount(true);
    setError(null);
    setSuccess(null);
    setPreview(null);

    axios
      .get('/accounts')
      .then((res) => {
        if (!mounted) return;
        const first = res.data?.data?.[0] ?? null;
        if (!first) {
          setAccountId(null);
          setError('No account found. Create your first account in setup before adding trades.');
          return;
        }
        setAccountId(first.id);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load account');
      })
      .finally(() => {
        if (mounted) setLoadingAccount(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !accountId) {
      return;
    }
    if (form.pnl === '' || Number.isNaN(Number(form.pnl))) {
      setPreview(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await axios.post(`/accounts/${accountId}/trades/preview`, {
          pnl: Number(form.pnl),
          close_time: new Date(form.close_time).toISOString(),
        });
        setPreview(res.data?.data ?? null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Preview failed');
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [open, accountId, form.pnl, form.close_time]);

  if (!open) {
    return null;
  }

  const stateColor =
    preview?.state === 'breach'
      ? palette.danger
      : preview?.state === 'caution'
      ? palette.warning
      : palette.success;

  const pnlNumber = Number(form.pnl || 0);
  const projectedTotal = Number(preview?.projected_total_profit ?? 0);
  const currentTotal = Number(preview?.current_total_profit ?? 0);
  const projectedConsistency = Number(preview?.projected_consistency_percent ?? 0);
  const consistencyLimit = Number(preview?.consistency_limit_percent ?? 0);
  const maxAllowedDay = Number(preview?.max_allowed_day_profit ?? 0);
  const remainingBeforeBreach = Number(preview?.remaining_before_breach ?? 0);
  const breachOverAmount = Number(preview?.breach_over_amount ?? 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`/accounts/${accountId}/trades`, {
        symbol: form.symbol.trim().toUpperCase(),
        type: form.type,
        lot_size: Number(form.lot_size || 0),
        pnl: Number(form.pnl),
        close_time: new Date(form.close_time).toISOString(),
        strategy_tag:
          strategySelection === 'custom'
            ? (customStrategy.trim() || null)
            : (strategySelection || null),
      });
      setSuccess('Trade added successfully.');
      onNotify?.('success', 'Trade added successfully.');
      onSaved?.();
      setForm((prev) => ({ ...prev, pnl: '' }));
      setStrategySelection('');
      setCustomStrategy('');
      window.setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add trade';
      setError(message);
      onNotify?.('error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: palette.overlay }}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col"
        style={{ backgroundColor: palette.card, borderColor: palette.border }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: palette.border }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: palette.text }}>
              Add Trade
            </h3>
            <p className="text-xs mt-1" style={{ color: palette.subText }}>
              Live consistency preview before save
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg border flex items-center justify-center"
            style={{ borderColor: palette.border, color: palette.subText }}
            aria-label="Close add trade modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto min-h-0">
            {loadingAccount ? <p style={{ color: palette.subText }}>Loading account...</p> : null}
            {error ? <p style={{ color: palette.danger, fontSize: 13 }}>{error}</p> : null}
            {success ? <p style={{ color: palette.success, fontSize: 13 }}>{success}</p> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: palette.subText }}>
              Symbol
              <input
                value={form.symbol}
                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
                required
              />
            </label>

            <label className="text-sm" style={{ color: palette.subText }}>
              Type
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{
                    borderColor: form.type === 'buy' ? `${palette.cyan}aa` : palette.border,
                    backgroundColor: form.type === 'buy' ? `${palette.cyan}1a` : palette.fieldBg,
                    color: palette.text,
                  }}
                  onClick={() => setForm((p) => ({ ...p, type: 'buy' }))}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{
                    borderColor: form.type === 'sell' ? `${palette.danger}aa` : palette.border,
                    backgroundColor: form.type === 'sell' ? `${palette.danger}1a` : palette.fieldBg,
                    color: palette.text,
                  }}
                  onClick={() => setForm((p) => ({ ...p, type: 'sell' }))}
                >
                  Sell
                </button>
              </div>
            </label>

            <label className="text-sm" style={{ color: palette.subText }}>
              PnL
              <input
                type="number"
                step="0.01"
                value={form.pnl}
                onChange={(e) => setForm((p) => ({ ...p, pnl: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
                placeholder="e.g. 350.00"
                required
              />
            </label>

            <label className="text-sm" style={{ color: palette.subText }}>
              Lot Size
              <input
                type="number"
                step="0.01"
                value={form.lot_size}
                onChange={(e) => setForm((p) => ({ ...p, lot_size: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
              />
            </label>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm" style={{ color: palette.subText }}>
                Strategy Setup
                <select
                  value={strategySelection}
                  onChange={(e) => setStrategySelection(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
                >
                  <option value="">Select strategy</option>
                  {STRATEGY_PRESETS.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {strategy}
                    </option>
                  ))}
                  <option value="custom">Custom...</option>
                </select>
              </label>

              <label className="text-sm" style={{ color: palette.subText }}>
                Close Time
                <input
                  type="datetime-local"
                  value={form.close_time}
                  onChange={(e) => setForm((p) => ({ ...p, close_time: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
                  required
                />
                <p className="mt-1 text-[11px]" style={{ color: palette.subText }}>
                  Needed to place this trade in the correct trading day for daily-loss reset and consistency checks.
                </p>
              </label>
            </div>

            {strategySelection === 'custom' ? (
              <label className="block text-sm" style={{ color: palette.subText }}>
                Custom Strategy Name
                <input
                  value={customStrategy}
                  onChange={(e) => setCustomStrategy(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ backgroundColor: palette.fieldBg, borderColor: palette.border, color: palette.text }}
                  placeholder="Type your strategy..."
                  required
                />
              </label>
            ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: palette.border, backgroundColor: palette.fieldBg }}>
              <p className="text-[11px]" style={{ color: palette.subText }}>PnL Profit You Make</p>
              <p className="text-sm font-semibold" style={{ color: pnlNumber >= 0 ? palette.success : palette.danger }}>
                {pnlNumber >= 0 ? '+' : ''}${pnlNumber.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: palette.border, backgroundColor: palette.fieldBg }}>
              <p className="text-[11px]" style={{ color: palette.subText }}>Current Total Profit</p>
              <p className="text-sm font-semibold" style={{ color: palette.text }}>${currentTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: palette.border, backgroundColor: palette.fieldBg }}>
              <p className="text-[11px]" style={{ color: palette.subText }}>Projected Total Profit</p>
              <p className="text-sm font-semibold" style={{ color: projectedTotal >= 0 ? palette.success : palette.danger }}>
                ${projectedTotal.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: palette.border, backgroundColor: palette.fieldBg }}>
              <p className="text-[11px]" style={{ color: palette.subText }}>Max Day Profit Allowed</p>
              <p className="text-sm font-semibold" style={{ color: palette.text }}>
                ${maxAllowedDay.toFixed(2)}
              </p>
            </div>
          </div>

          {preview ? (
            <div
              className="rounded-xl border px-3 py-3"
              style={{
                borderColor: `${stateColor}66`,
                backgroundColor: `${stateColor}14`,
              }}
            >
              <div className="flex items-center justify-between">
                <strong className="inline-flex items-center gap-1" style={{ color: stateColor, textTransform: 'capitalize', fontSize: 13 }}>
                  {preview.state === 'safe' ? <CircleCheck size={14} /> : <CircleAlert size={14} />}
                  {preview.state}
                </strong>
                <span style={{ color: palette.text, fontSize: 13 }}>
                  Day Max ${Number(preview?.projected_max_day_profit ?? 0).toFixed(2)} / Allowed ${maxAllowedDay.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: palette.fieldBg }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, consistencyLimit > 0 ? (projectedConsistency / consistencyLimit) * 100 : 0))}%`,
                    backgroundColor: stateColor,
                  }}
                ></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs" style={{ color: palette.subText }}>
                <span>Consistency: {projectedConsistency}% / {consistencyLimit}%</span>
                <span>
                  {preview.state === 'breach'
                    ? `Over by $${breachOverAmount.toFixed(2)}`
                    : `Remaining $${remainingBeforeBreach.toFixed(2)}`}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: palette.subText }}>
                {preview.message}
              </p>
            </div>
          ) : null}

          </div>

          <div className="px-5 py-4 border-t flex items-center justify-end gap-2 sticky bottom-0" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: palette.border, color: palette.subText }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingAccount || !accountId || (strategySelection === 'custom' && customStrategy.trim().length === 0)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: palette.cyan,
                color: theme === 'dark' ? '#001018' : '#FFFFFF',
                opacity: saving || loadingAccount || !accountId ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
