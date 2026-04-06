import { useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, CircleCheck, UploadCloud, PlusCircle, Link2 } from 'lucide-react';

type OnboardingWizardProps = {
  open: boolean;
  theme: 'dark' | 'light';
  onClose: () => void;
  onComplete: () => void;
  onManualAddTrade: () => void;
  onImportCsv?: () => void;
};

type FirmPreset = {
  key: string;
  label: string;
  dailyLossPercent: number;
  profitTargetPercent: number;
  consistencyDefault: number;
};

const FIRM_PRESETS: FirmPreset[] = [
  { key: 'ftmo', label: 'FTMO', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'funderpro', label: 'FunderPro', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'e8', label: 'E8 Markets', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'myfundedfx', label: 'MyFundedFX', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
];

export function OnboardingWizard({ open, theme, onClose, onComplete, onManualAddTrade, onImportCsv }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<number | null>(null);

  const [selectedFirm, setSelectedFirm] = useState<FirmPreset>(FIRM_PRESETS[0]);
  const [consistencyLimit, setConsistencyLimit] = useState<number>(20);
  const [accountMode, setAccountMode] = useState<'single' | 'multi'>('single');
  const [accountName, setAccountName] = useState('Primary Account');
  const [startingBalance, setStartingBalance] = useState(100000);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [resetTime, setResetTime] = useState('00:00');

  const colors = useMemo(
    () =>
      theme === 'dark'
        ? {
            overlay: 'rgba(4, 8, 16, 0.72)',
            bg: '#1E2025',
            border: '#2A2D35',
            text: '#F4F7FB',
            subText: '#9CA3AF',
            card: '#151821',
            accent: '#00F2FE',
            success: '#10B981',
          }
        : {
            overlay: 'rgba(17, 24, 39, 0.35)',
            bg: '#FFFFFF',
            border: '#E5E7EB',
            text: '#0F172A',
            subText: '#64748B',
            card: '#F8FAFC',
            accent: '#0EA5E9',
            success: '#10B981',
          },
    [theme]
  );

  if (!open) return null;

  const progress = (step / 4) * 100;

  async function handleFinishSetup() {
    setSaving(true);
    setError(null);

    try {
      const profitTargetAmount = (startingBalance * selectedFirm.profitTargetPercent) / 100;

      const accountRes = await axios.post('/accounts', {
        account_name: `${accountName}${accountMode === 'multi' ? ' (Portfolio)' : ''}`,
        initial_balance: startingBalance,
        current_balance: startingBalance,
        profit_target: profitTargetAmount,
        consistency_rule_percent: consistencyLimit,
        daily_drawdown_limit_percent: selectedFirm.dailyLossPercent,
        max_loss_limit_percent: 10,
        timezone,
        trading_day_reset_timezone: timezone,
        trading_day_reset_time: resetTime,
        status: 'active',
      });

      const accountId = accountRes.data?.data?.id;
      setCreatedAccountId(accountId ?? null);

      if (accountId) {
        await axios.post('/rules', {
          trading_account_id: accountId,
          starting_balance: startingBalance,
          profit_target_percent: selectedFirm.profitTargetPercent,
          max_daily_loss_percent: selectedFirm.dailyLossPercent,
          consistency_rule_type: 'custom',
          consistency_threshold_percent: consistencyLimit,
        });
      }

      onComplete();
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to finish setup');
    } finally {
      setSaving(false);
    }
  }

  function renderStepContent() {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 1: Select Your Prop Firm</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            We auto-fill default risk rules for your selected firm.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIRM_PRESETS.map((firm) => {
              const active = selectedFirm.key === firm.key;
              return (
                <button
                  key={firm.key}
                  className="rounded-xl border px-4 py-4 text-left transition-all"
                  style={{
                    backgroundColor: active ? `${colors.accent}16` : colors.card,
                    borderColor: active ? `${colors.accent}99` : colors.border,
                    color: colors.text,
                  }}
                  onClick={() => {
                    setSelectedFirm(firm);
                    setConsistencyLimit(firm.consistencyDefault);
                  }}
                >
                  <p className="font-medium">{firm.label}</p>
                  <p className="text-xs mt-1" style={{ color: colors.subText }}>
                    Daily Loss {firm.dailyLossPercent}% • Target {firm.profitTargetPercent}%
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 2: Set Consistency Guardrail</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Choose your consistency limit. This powers all risk indicators.
          </p>
          <div className="rounded-xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <span style={{ color: colors.subText }}>Consistency Threshold</span>
              <strong style={{ color: colors.text }}>{consistencyLimit}%</strong>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={consistencyLimit}
              onChange={(e) => setConsistencyLimit(Number(e.target.value))}
              className="w-full mt-4"
            />
            <p className="text-xs mt-2" style={{ color: colors.subText }}>
              Caution starts at {Math.max(0, consistencyLimit - 2)}%
            </p>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 3: Account Mode & Profile</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Configure your account foundation and trading-day reset context.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-lg border py-2 text-sm"
              style={{
                borderColor: accountMode === 'single' ? colors.accent : colors.border,
                backgroundColor: accountMode === 'single' ? `${colors.accent}1a` : colors.card,
                color: colors.text,
              }}
              onClick={() => setAccountMode('single')}
            >
              Single Account
            </button>
            <button
              className="rounded-lg border py-2 text-sm"
              style={{
                borderColor: accountMode === 'multi' ? colors.accent : colors.border,
                backgroundColor: accountMode === 'multi' ? `${colors.accent}1a` : colors.card,
                color: colors.text,
              }}
              onClick={() => setAccountMode('multi')}
            >
              Portfolio Mode
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Account Name
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </label>
            <label className="text-sm" style={{ color: colors.subText }}>
              Starting Balance (USD)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value || 0))}
              />
            </label>
            <label className="text-sm" style={{ color: colors.subText }}>
              Timezone
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </label>
            <label className="text-sm" style={{ color: colors.subText }}>
              Trading Day Reset Time
              <input
                type="time"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
              />
            </label>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 4: Activate Data Flow</h3>
        <p className="text-sm" style={{ color: colors.subText }}>
          Choose how you want to start populating the dashboard.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="rounded-xl border p-4 text-left" style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}>
            <Link2 size={18} style={{ color: colors.accent }} />
            <p className="mt-3 font-medium">Sync MT4/MT5</p>
            <p className="text-xs mt-1" style={{ color: colors.subText }}>Coming next: direct connection</p>
          </button>

          <button
            className="rounded-xl border p-4 text-left"
            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
            onClick={onImportCsv}
          >
            <UploadCloud size={18} style={{ color: colors.accent }} />
            <p className="mt-3 font-medium">Import CSV</p>
            <p className="text-xs mt-1" style={{ color: colors.subText }}>Use Trade Log import from sidebar</p>
          </button>

          <button
            className="rounded-xl border p-4 text-left"
            style={{ backgroundColor: `${colors.accent}10`, borderColor: `${colors.accent}88`, color: colors.text }}
            onClick={onManualAddTrade}
          >
            <PlusCircle size={18} style={{ color: colors.accent }} />
            <p className="mt-3 font-medium">Manual Add Trade</p>
            <p className="text-xs mt-1" style={{ color: colors.subText }}>Open Add Trade with live risk preview</p>
          </button>
        </div>

        {createdAccountId ? (
          <div className="rounded-lg border px-3 py-2 inline-flex items-center gap-2" style={{ borderColor: `${colors.success}55`, color: colors.success }}>
            <CircleCheck size={16} />
            Setup complete. Account #{createdAccountId} is active.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: colors.overlay }}>
      <div className="w-full max-w-3xl rounded-2xl border shadow-2xl" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
        <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: colors.text }}>Welcome to ConsisTracker</h2>
              <p className="text-sm mt-1" style={{ color: colors.subText }}>Guided setup for your first prop account.</p>
            </div>
            <button className="text-sm px-3 py-2 rounded-lg border" style={{ color: colors.subText, borderColor: colors.border }} onClick={onClose}>
              Close
            </button>
          </div>
          <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: colors.card }}>
            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: colors.accent }} />
          </div>
          <p className="text-xs mt-2" style={{ color: colors.subText }}>Step {step} of 4</p>
        </div>

        <div className="px-6 py-5">
          {error ? <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p> : null}
          {renderStepContent()}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: colors.border, color: colors.subText, opacity: step === 1 ? 0.4 : 1 }}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < 4 ? (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: colors.accent, color: theme === 'dark' ? '#001018' : '#FFFFFF' }}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: colors.accent, color: theme === 'dark' ? '#001018' : '#FFFFFF', opacity: saving ? 0.65 : 1 }}
              onClick={handleFinishSetup}
              disabled={saving}
            >
              {saving ? 'Finishing...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
