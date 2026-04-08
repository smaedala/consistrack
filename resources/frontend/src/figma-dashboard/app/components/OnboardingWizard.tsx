import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, CircleCheck, UploadCloud, PlusCircle, Link2, CircleHelp } from 'lucide-react';

type OnboardingWizardProps = {
  open: boolean;
  theme: 'dark' | 'light';
  helpMode?: boolean;
  onClose: () => void;
  onComplete: () => void;
  onManualAddTrade: () => void;
  onImportCsv?: () => void;
};

type VenuePreset = {
  key: string;
  label: string;
  category: 'prop' | 'broker';
  dailyLossPercent: number;
  profitTargetPercent: number;
  consistencyDefault: number;
};

const VENUE_PRESETS: VenuePreset[] = [
  // Prop firms
  { key: 'ftmo', label: 'FTMO', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'fundingpips', label: 'Funding Pips', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'funderpro', label: 'FunderPro', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'myfundedfx', label: 'MyFundedFX', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'e8', label: 'E8 Markets', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'the5ers', label: 'The5ers', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'fundednext', label: 'FundedNext', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'brightfunded', label: 'BrightFunded', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'citytraders-imperium', label: 'City Traders Imperium', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'audacity-capital', label: 'Audacity Capital', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'goatfundedtrader', label: 'Goat Funded Trader', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'sabio-trade', label: 'SabioTrade', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'surge-trader', label: 'SurgeTrader', category: 'prop', dailyLossPercent: 4, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'true-forex-funds', label: 'True Forex Funds', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'topstep', label: 'Topstep', category: 'prop', dailyLossPercent: 3, profitTargetPercent: 6, consistencyDefault: 20 },
  { key: 'alpha-capital', label: 'Alpha Capital Group', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'blue-guardian', label: 'Blue Guardian', category: 'prop', dailyLossPercent: 4, profitTargetPercent: 8, consistencyDefault: 20 },
  { key: 'traders-with-edge', label: 'Traders With Edge', category: 'prop', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },

  // Brokers
  { key: 'ic-markets', label: 'IC Markets', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'pepperstone', label: 'Pepperstone', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'xm', label: 'XM', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'exness', label: 'Exness', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'fxcm', label: 'FXCM', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'admirals', label: 'Admirals', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'avatrade', label: 'AvaTrade', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'vantage', label: 'Vantage', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'eightcap', label: 'Eightcap', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'blackbull-markets', label: 'BlackBull Markets', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'fbs', label: 'FBS', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'hfm', label: 'HFM', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'fp-markets', label: 'FP Markets', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'tickmill', label: 'Tickmill', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'oanda', label: 'OANDA', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'forexcom', label: 'FOREX.com', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'ig', label: 'IG', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
  { key: 'interactive-brokers', label: 'Interactive Brokers', category: 'broker', dailyLossPercent: 5, profitTargetPercent: 10, consistencyDefault: 20 },
];

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
const ONBOARDING_DRAFT_KEY = 'consistracker_onboarding_draft_v1';

function FieldHint({ text, color, helpMode = false }: { text: string; color: string; helpMode?: boolean }) {
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

export function OnboardingWizard({ open, theme, helpMode = false, onClose, onComplete, onManualAddTrade, onImportCsv }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const [selectedVenue, setSelectedVenue] = useState<VenuePreset>(VENUE_PRESETS[0]);
  const [venueCategory, setVenueCategory] = useState<'prop' | 'broker'>('prop');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueListOpen, setVenueListOpen] = useState(false);
  const [customVenueName, setCustomVenueName] = useState('');
  const [strategySelection, setStrategySelection] = useState('');
  const [customStrategy, setCustomStrategy] = useState('');
  const [profitTargetUnit, setProfitTargetUnit] = useState<'percent' | 'usd'>('percent');
  const [profitTargetValue, setProfitTargetValue] = useState<string>('10');
  const [dailyLossUnit, setDailyLossUnit] = useState<'percent' | 'usd'>('percent');
  const [dailyLossValue, setDailyLossValue] = useState<string>('5');
  const [maxLossUnit, setMaxLossUnit] = useState<'percent' | 'usd'>('percent');
  const [maxLossValue, setMaxLossValue] = useState<string>('10');
  const [consistencyMode, setConsistencyMode] = useState<'custom' | 'none'>('custom');
  const [consistencyLimit, setConsistencyLimit] = useState<number>(20);
  const [accountMode, setAccountMode] = useState<'single' | 'multi'>('single');
  const [accountName, setAccountName] = useState('Primary Account');
  const [startingBalance, setStartingBalance] = useState(100000);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [resetTime, setResetTime] = useState('00:00');
  const [personalFullName, setPersonalFullName] = useState('');
  const [personalCountry, setPersonalCountry] = useState('');
  const [personalExperience, setPersonalExperience] = useState('Beginner');

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

  const filteredVenueOptions = useMemo(
    () =>
      VENUE_PRESETS.filter((venue) => {
        if (venue.category !== venueCategory) return false;
        if (!venueQuery.trim()) return true;
        return venue.label.toLowerCase().includes(venueQuery.toLowerCase());
      }),
    [venueCategory, venueQuery]
  );

  const progress = (step / 6) * 100;

  useEffect(() => {
    if (!open) return;

    try {
      const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') {
          if (typeof draft.step === 'number') setStep(Math.max(1, Math.min(6, draft.step)));
          if (typeof draft.venueCategory === 'string') setVenueCategory(draft.venueCategory);
          if (typeof draft.selectedVenueKey === 'string') {
            const found = VENUE_PRESETS.find((v) => v.key === draft.selectedVenueKey);
            if (found) setSelectedVenue(found);
          }
          if (typeof draft.customVenueName === 'string') setCustomVenueName(draft.customVenueName);
          if (typeof draft.strategySelection === 'string') setStrategySelection(draft.strategySelection);
          if (typeof draft.customStrategy === 'string') setCustomStrategy(draft.customStrategy);
          if (typeof draft.profitTargetUnit === 'string') setProfitTargetUnit(draft.profitTargetUnit);
          if (typeof draft.profitTargetValue === 'string') setProfitTargetValue(draft.profitTargetValue);
          if (typeof draft.dailyLossUnit === 'string') setDailyLossUnit(draft.dailyLossUnit);
          if (typeof draft.dailyLossValue === 'string') setDailyLossValue(draft.dailyLossValue);
          if (typeof draft.maxLossUnit === 'string') setMaxLossUnit(draft.maxLossUnit);
          if (typeof draft.maxLossValue === 'string') setMaxLossValue(draft.maxLossValue);
          if (typeof draft.consistencyMode === 'string') setConsistencyMode(draft.consistencyMode);
          if (typeof draft.consistencyLimit === 'number') setConsistencyLimit(draft.consistencyLimit);
          if (typeof draft.accountMode === 'string') setAccountMode(draft.accountMode);
          if (typeof draft.accountName === 'string') setAccountName(draft.accountName);
          if (typeof draft.startingBalance === 'number') setStartingBalance(draft.startingBalance);
          if (typeof draft.timezone === 'string') setTimezone(draft.timezone);
          if (typeof draft.resetTime === 'string') setResetTime(draft.resetTime);
          if (typeof draft.personalFullName === 'string') setPersonalFullName(draft.personalFullName);
          if (typeof draft.personalCountry === 'string') setPersonalCountry(draft.personalCountry);
          if (typeof draft.personalExperience === 'string') setPersonalExperience(draft.personalExperience);
        }
      }
    } catch {
      // ignore broken draft state
    }

    let mounted = true;
    axios
      .get('/auth/me')
      .then((res) => {
        if (!mounted) return;
        const name = String(res.data?.data?.name || '').trim();
        const email = String(res.data?.data?.email || '').trim();
        if (name) setPersonalFullName(name);
        if (email) setUserEmail(email);
      })
      .catch(() => {
        // keep defaults when auth profile is unavailable
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const payload = {
      step,
      venueCategory,
      selectedVenueKey: selectedVenue.key,
      customVenueName,
      strategySelection,
      customStrategy,
      profitTargetUnit,
      profitTargetValue,
      dailyLossUnit,
      dailyLossValue,
      maxLossUnit,
      maxLossValue,
      consistencyMode,
      consistencyLimit,
      accountMode,
      accountName,
      startingBalance,
      timezone,
      resetTime,
      personalFullName,
      personalCountry,
      personalExperience,
    };
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(payload));
  }, [
    open,
    step,
    venueCategory,
    selectedVenue,
    customVenueName,
    strategySelection,
    customStrategy,
    profitTargetUnit,
    profitTargetValue,
    dailyLossUnit,
    dailyLossValue,
    maxLossUnit,
    maxLossValue,
    consistencyMode,
    consistencyLimit,
    accountMode,
    accountName,
    startingBalance,
    timezone,
    resetTime,
    personalFullName,
    personalCountry,
    personalExperience,
  ]);

  const parseNumber = (value: string): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const toPercent = (value: string, unit: 'percent' | 'usd', baseBalance: number): number => {
    const n = parseNumber(value);
    if (unit === 'percent') return n;
    if (baseBalance <= 0) return 0;
    return (n / baseBalance) * 100;
  };

  const toUsd = (value: string, unit: 'percent' | 'usd', baseBalance: number): number => {
    const n = parseNumber(value);
    if (unit === 'usd') return n;
    return (baseBalance * n) / 100;
  };

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!personalFullName.trim()) e.personalFullName = 'Full name is required.';
    if (!personalCountry.trim()) e.personalCountry = 'Country is required.';

    if (!strategySelection) e.strategySelection = 'Choose your strategy.';
    if (strategySelection === 'custom' && !customStrategy.trim()) e.customStrategy = 'Type your custom strategy.';

    const profitTargetPercent = toPercent(profitTargetValue, profitTargetUnit, startingBalance);
    const dailyLossPercent = toPercent(dailyLossValue, dailyLossUnit, startingBalance);
    const maxLossPercent = toPercent(maxLossValue, maxLossUnit, startingBalance);

    if (startingBalance <= 0) e.startingBalance = 'Starting balance must be greater than 0.';
    if (profitTargetPercent <= 0) e.profitTargetValue = 'Profit target must be greater than 0.';
    if (dailyLossPercent <= 0) e.dailyLossValue = 'Daily loss must be greater than 0.';
    if (maxLossPercent <= 0) e.maxLossValue = 'Max loss must be greater than 0.';
    if (dailyLossPercent > maxLossPercent) e.dailyVsMax = 'Daily loss cannot be greater than max loss.';

    if (consistencyMode === 'custom' && (consistencyLimit < 5 || consistencyLimit > 100)) {
      e.consistencyLimit = 'Consistency must be between 5% and 100%.';
    }

    if (!accountName.trim()) e.accountName = 'Account name is required.';
    if (!timezone.trim()) e.timezone = 'Timezone is required.';
    if (!resetTime.trim()) e.resetTime = 'Reset time is required.';
    return e;
  }, [
    personalFullName,
    personalCountry,
    strategySelection,
    customStrategy,
    profitTargetValue,
    profitTargetUnit,
    dailyLossValue,
    dailyLossUnit,
    maxLossValue,
    maxLossUnit,
    startingBalance,
    consistencyMode,
    consistencyLimit,
    accountName,
    timezone,
    resetTime,
  ]);

  const stepErrors = useMemo(() => {
    return {
      1: [fieldErrors.personalFullName, fieldErrors.personalCountry].filter(Boolean) as string[],
      2: [fieldErrors.strategySelection, fieldErrors.customStrategy].filter(Boolean) as string[],
      3: [fieldErrors.startingBalance, fieldErrors.profitTargetValue, fieldErrors.dailyLossValue, fieldErrors.maxLossValue, fieldErrors.dailyVsMax].filter(Boolean) as string[],
      4: [fieldErrors.consistencyLimit].filter(Boolean) as string[],
      5: [fieldErrors.accountName, fieldErrors.timezone, fieldErrors.resetTime].filter(Boolean) as string[],
      6: [] as string[],
    };
  }, [fieldErrors]);

  const canProceedStep = (targetStep: number) => (stepErrors[targetStep as 1 | 2 | 3 | 4 | 5 | 6] || []).length === 0;

  async function handleFinishSetup() {
    setSaving(true);
    setError(null);

    try {
      const profitTargetPercent = toPercent(profitTargetValue, profitTargetUnit, startingBalance);
      const dailyLossPercent = toPercent(dailyLossValue, dailyLossUnit, startingBalance);
      const maxLossPercent = toPercent(maxLossValue, maxLossUnit, startingBalance);

      if (startingBalance <= 0) {
        setError('Starting balance must be greater than 0.');
        setSaving(false);
        return;
      }
      if (profitTargetPercent <= 0) {
        setError('Profit target must be greater than 0.');
        setSaving(false);
        return;
      }
      if (dailyLossPercent <= 0 || maxLossPercent <= 0) {
        setError('Daily loss and max loss must be greater than 0.');
        setSaving(false);
        return;
      }
      if (dailyLossPercent > maxLossPercent) {
        setError('Daily loss limit cannot be greater than max loss limit.');
        setSaving(false);
        return;
      }

      const profitTargetAmount = (startingBalance * profitTargetPercent) / 100;
      const normalizedStrategy =
        strategySelection === 'custom'
          ? customStrategy.trim()
          : strategySelection.trim();
      const consistencyPercent = consistencyMode === 'none' ? 100 : consistencyLimit;
      const selectedVenueName = customVenueName.trim() || selectedVenue.label;

      const accountRes = await axios.post('/accounts', {
        account_name: `${accountName}${accountMode === 'multi' ? ' (Portfolio)' : ''} • ${selectedVenueName}`,
        initial_balance: startingBalance,
        current_balance: startingBalance,
        profit_target: profitTargetAmount,
        consistency_rule_percent: consistencyPercent,
        consistency_rule_enabled: consistencyMode !== 'none',
        daily_drawdown_limit_percent: Math.max(1, Math.round(dailyLossPercent)),
        max_loss_limit_percent: Math.max(1, Math.round(maxLossPercent)),
        timezone,
        trading_day_reset_timezone: timezone,
        trading_day_reset_time: resetTime,
        status: 'active',
        default_strategy_tag: normalizedStrategy || null,
        trader_full_name: personalFullName || null,
        trader_country: personalCountry || null,
        trader_experience_level: personalExperience || null,
      });

      const accountId = accountRes.data?.data?.id;
      setCreatedAccountId(accountId ?? null);

      if (accountId) {
        if (consistencyMode !== 'none') {
          await axios.post('/rules', {
            trading_account_id: accountId,
            starting_balance: startingBalance,
            profit_target_percent: profitTargetPercent,
            max_daily_loss_percent: dailyLossPercent,
            consistency_rule_type: 'custom',
            consistency_threshold_percent: consistencyLimit,
          });
        }
      }

      onComplete();
      setStep(6);
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
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
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 1: Personal Information</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Add your profile details so your workspace is personalized from day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Full Name
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={personalFullName}
                onChange={(e) => setPersonalFullName(e.target.value)}
                placeholder="Your full name"
              />
              {fieldErrors.personalFullName ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.personalFullName}</p> : null}
            </label>

            <label className="text-sm" style={{ color: colors.subText }}>
              Email
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text, opacity: 0.9 }}
                value={userEmail}
                readOnly
                placeholder="you@example.com"
              />
            </label>

            <label className="text-sm" style={{ color: colors.subText }}>
              Country
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={personalCountry}
                onChange={(e) => setPersonalCountry(e.target.value)}
                placeholder="Nigeria, USA, UK..."
              />
              {fieldErrors.personalCountry ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.personalCountry}</p> : null}
            </label>

            <label className="text-sm" style={{ color: colors.subText }}>
              Experience Level
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={personalExperience}
                onChange={(e) => setPersonalExperience(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Funded Trader">Funded Trader</option>
              </select>
            </label>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 2: Firm/Broker & Strategy Setup</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Select from the list in two steps: venue type then venue name. This is optimized for mobile and desktop.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Venue Type
              <FieldHint
                color={colors.subText}
                helpMode={helpMode}
                text="Choose Prop Firm or Broker first. The list below will filter by this type."
              />
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={venueCategory}
                onChange={(e) => {
                  const nextCategory = e.target.value as 'prop' | 'broker';
                  setVenueCategory(nextCategory);
                  const firstOption = VENUE_PRESETS.find((v) => v.category === nextCategory);
                  if (firstOption) {
                    setSelectedVenue(firstOption);
                    setConsistencyLimit(firstOption.consistencyDefault);
                    setProfitTargetValue(String(firstOption.profitTargetPercent));
                    setDailyLossValue(String(firstOption.dailyLossPercent));
                    setVenueQuery('');
                    setVenueListOpen(false);
                  }
                }}
              >
                <option value="prop">Prop Firm</option>
                <option value="broker">Broker</option>
              </select>
            </label>

            <div className="text-sm relative" style={{ color: colors.subText }}>
              Search & Select {venueCategory === 'prop' ? 'Prop Firm' : 'Broker'}
              <FieldHint
                color={colors.subText}
                helpMode={helpMode}
                text="Type a few letters to quickly find your venue, then click from the list."
              />
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                placeholder={`Click and type to find ${venueCategory === 'prop' ? 'firm' : 'broker'}...`}
                value={venueQuery}
                onFocus={() => setVenueListOpen(true)}
                onChange={(e) => {
                  setVenueQuery(e.target.value);
                  setVenueListOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setVenueListOpen(false), 120);
                }}
              />
              {venueListOpen ? (
                <div
                  className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border shadow-lg"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                >
                  {filteredVenueOptions.length > 0 ? (
                    filteredVenueOptions.map((venue) => (
                      <button
                        key={venue.key}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                        style={{
                          borderColor: colors.border,
                          color: selectedVenue.key === venue.key ? colors.text : colors.subText,
                          backgroundColor: selectedVenue.key === venue.key ? `${colors.accent}16` : 'transparent',
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSelectedVenue(venue);
                          setVenueQuery('');
                          setConsistencyLimit(venue.consistencyDefault);
                          setProfitTargetValue(String(venue.profitTargetPercent));
                          setDailyLossValue(String(venue.dailyLossPercent));
                          setVenueListOpen(false);
                        }}
                      >
                        <div className="font-medium">{venue.label}</div>
                        <div className="text-xs" style={{ color: colors.subText }}>
                          Daily Loss {venue.dailyLossPercent}% • Target {venue.profitTargetPercent}%
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs" style={{ color: colors.subText }}>
                      No match found. Use Custom Venue below.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.subText }}>
            Selected: <strong style={{ color: colors.text }}>{customVenueName.trim() || selectedVenue.label}</strong>
            <br />
            Rule base: Daily Loss {selectedVenue.dailyLossPercent}% • Target {selectedVenue.profitTargetPercent}%
          </div>
          {venueQuery.trim() ? (
            <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.subText }}>
              Quick picks:
              <div className="mt-2 flex flex-wrap gap-2">
                {filteredVenueOptions
                  .slice(0, 8)
                  .map((venue) => (
                    <button
                      key={venue.key}
                      type="button"
                      className="rounded-md border px-2 py-1 text-xs"
                      style={{
                        borderColor: selectedVenue.key === venue.key ? `${colors.accent}99` : colors.border,
                        color: selectedVenue.key === venue.key ? colors.text : colors.subText,
                        backgroundColor: selectedVenue.key === venue.key ? `${colors.accent}16` : colors.card,
                      }}
                      onClick={() => {
                        setSelectedVenue(venue);
                        setVenueQuery('');
                        setConsistencyLimit(venue.consistencyDefault);
                        setProfitTargetValue(String(venue.profitTargetPercent));
                        setDailyLossValue(String(venue.dailyLossPercent));
                      }}
                    >
                      {venue.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Custom Venue (Optional)
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={customVenueName}
                onChange={(e) => setCustomVenueName(e.target.value)}
                placeholder="Type your firm or broker if not listed"
              />
            </label>
            <div className="rounded-lg border px-3 py-2 text-xs flex items-center" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.subText }}>
              If your venue is not listed, enter it manually and continue.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Primary Strategy
              <FieldHint
                color={colors.subText}
                helpMode={helpMode}
                text="Used as the default strategy tag when you add new trades."
              />
              <select
                value={strategySelection}
                onChange={(e) => setStrategySelection(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
              >
                <option value="">Select strategy</option>
                {STRATEGY_PRESETS.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {strategy}
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {fieldErrors.strategySelection ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.strategySelection}</p> : null}
            </label>

            {strategySelection === 'custom' ? (
              <label className="text-sm" style={{ color: colors.subText }}>
                Custom Strategy
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                  value={customStrategy}
                  onChange={(e) => setCustomStrategy(e.target.value)}
                  placeholder="Type your strategy..."
                />
                {fieldErrors.customStrategy ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.customStrategy}</p> : null}
              </label>
            ) : (
              <div className="rounded-lg border px-3 py-2 text-sm flex items-center" style={{ borderColor: colors.border, backgroundColor: colors.card, color: colors.subText }}>
                This strategy will be auto-used in Add Trade.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 3) {
      const profitTargetUsdPreview = toUsd(profitTargetValue, profitTargetUnit, startingBalance);
      const dailyLossUsdPreview = toUsd(dailyLossValue, dailyLossUnit, startingBalance);
      const maxLossUsdPreview = toUsd(maxLossValue, maxLossUnit, startingBalance);
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 3: Risk Limits Setup</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Set core risk values. You can type each value as percentage or USD.
          </p>
          <p className="text-xs" style={{ color: colors.subText }}>
            Tip: Start with Standard preset, then fine-tune values manually.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.card }}
              onClick={() => {
                setProfitTargetUnit('percent');
                setDailyLossUnit('percent');
                setMaxLossUnit('percent');
                setProfitTargetValue('8');
                setDailyLossValue('4');
                setMaxLossValue('8');
              }}
            >
              Conservative
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs"
              style={{ borderColor: `${colors.accent}80`, color: colors.text, backgroundColor: `${colors.accent}12` }}
              onClick={() => {
                setProfitTargetUnit('percent');
                setDailyLossUnit('percent');
                setMaxLossUnit('percent');
                setProfitTargetValue('10');
                setDailyLossValue('5');
                setMaxLossValue('10');
              }}
            >
              Standard
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.card }}
              onClick={() => {
                setProfitTargetUnit('percent');
                setDailyLossUnit('percent');
                setMaxLossUnit('percent');
                setProfitTargetValue('12');
                setDailyLossValue('6');
                setMaxLossValue('12');
              }}
            >
              Aggressive
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm" style={{ color: colors.subText }}>
              Starting Balance (USD)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value || 0))}
              />
              {fieldErrors.startingBalance ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.startingBalance}</p> : null}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                Profit Target
                <FieldHint
                  color={colors.subText}
                  helpMode={helpMode}
                  text="Your goal to pass/complete the account phase. You can enter % or USD."
                />
              </p>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={profitTargetValue}
                  onChange={(e) => setProfitTargetValue(e.target.value)}
                />
                <select
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={profitTargetUnit}
                  onChange={(e) => setProfitTargetUnit(e.target.value as 'percent' | 'usd')}
                >
                  <option value="percent">%</option>
                  <option value="usd">USD</option>
                </select>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.subText }}>
                ~ ${profitTargetUsdPreview.toFixed(2)} target amount
              </p>
              {fieldErrors.profitTargetValue ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.profitTargetValue}</p> : null}
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                Daily Loss Limit
                <FieldHint
                  color={colors.subText}
                  helpMode={helpMode}
                  text="Maximum loss allowed in one trading day before you are at risk."
                />
              </p>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={dailyLossValue}
                  onChange={(e) => setDailyLossValue(e.target.value)}
                />
                <select
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={dailyLossUnit}
                  onChange={(e) => setDailyLossUnit(e.target.value as 'percent' | 'usd')}
                >
                  <option value="percent">%</option>
                  <option value="usd">USD</option>
                </select>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.subText }}>
                ~ ${dailyLossUsdPreview.toFixed(2)} daily buffer
              </p>
              {fieldErrors.dailyLossValue ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.dailyLossValue}</p> : null}
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                Maximum Loss Limit
                <FieldHint
                  color={colors.subText}
                  helpMode={helpMode}
                  text="Total maximum drawdown allowed on the account."
                />
              </p>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={maxLossValue}
                  onChange={(e) => setMaxLossValue(e.target.value)}
                />
                <select
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  value={maxLossUnit}
                  onChange={(e) => setMaxLossUnit(e.target.value as 'percent' | 'usd')}
                >
                  <option value="percent">%</option>
                  <option value="usd">USD</option>
                </select>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.subText }}>
                ~ ${maxLossUsdPreview.toFixed(2)} max loss cap
              </p>
              {fieldErrors.maxLossValue ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.maxLossValue}</p> : null}
            </div>
          </div>
          {fieldErrors.dailyVsMax ? <p className="text-xs" style={{ color: '#EF4444' }}>{fieldErrors.dailyVsMax}</p> : null}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 4: Consistency Rule</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Choose how consistency control should work for this account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              className="rounded-lg border py-3 px-3 text-sm text-left"
              style={{
                borderColor: consistencyMode === 'custom' ? colors.accent : colors.border,
                backgroundColor: consistencyMode === 'custom' ? `${colors.accent}1a` : colors.card,
                color: colors.text,
              }}
              onClick={() => setConsistencyMode('custom')}
            >
              <p className="font-medium">Set your consistency</p>
              <p className="text-xs mt-1" style={{ color: colors.subText }}>Use a strict threshold (recommended)</p>
            </button>
            <button
              className="rounded-lg border py-3 px-3 text-sm text-left"
              style={{
                borderColor: consistencyMode === 'none' ? colors.accent : colors.border,
                backgroundColor: consistencyMode === 'none' ? `${colors.accent}1a` : colors.card,
                color: colors.text,
              }}
              onClick={() => setConsistencyMode('none')}
            >
              <p className="font-medium">No consistency rule</p>
              <p className="text-xs mt-1" style={{ color: colors.subText }}>Track only profit target and drawdown</p>
            </button>
          </div>

          {consistencyMode === 'custom' ? (
            <div className="rounded-xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <span style={{ color: colors.subText }}>
                  Consistency Threshold
                  <FieldHint
                    color={colors.subText}
                    helpMode={helpMode}
                    text="How concentrated your best day can be versus total profit."
                  />
                </span>
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
              {fieldErrors.consistencyLimit ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.consistencyLimit}</p> : null}
            </div>
          ) : (
            <div className="rounded-xl border p-4 text-sm" style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.subText }}>
              Consistency checks are disabled for this account. You can enable it later in Risk Settings.
            </div>
          )}
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 5: Account Mode & Reset Clock</h3>
          <p className="text-sm" style={{ color: colors.subText }}>
            Configure account structure and trading-day context.
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
              {fieldErrors.accountName ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.accountName}</p> : null}
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
              <FieldHint
                color={colors.subText}
                helpMode={helpMode}
                text="Used to evaluate daily limits and day-based analytics correctly."
              />
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
              {fieldErrors.timezone ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.timezone}</p> : null}
            </label>
            <label className="text-sm" style={{ color: colors.subText }}>
              Trading Day Reset Time
              <FieldHint
                color={colors.subText}
                helpMode={helpMode}
                text="When your trading day rolls over for daily loss and daily stats."
              />
              <input
                type="time"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
              />
              {fieldErrors.resetTime ? <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.resetTime}</p> : null}
            </label>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold" style={{ color: colors.text }}>Stage 6: Activate Data Flow</h3>
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
          <div className="rounded-lg border px-3 py-3 space-y-2" style={{ borderColor: `${colors.success}55`, color: colors.success }}>
            <div className="inline-flex items-center gap-2">
              <CircleCheck size={16} />
              Setup complete. Account #{createdAccountId} is active.
            </div>
            <p className="text-xs" style={{ color: colors.subText }}>
              First-trade guide: 1) Click Manual Add Trade 2) Enter symbol + PnL 3) Save and watch equity + consistency update live.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: colors.overlay }}>
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          boxShadow: helpMode ? '0 0 0 1px rgba(0,242,254,0.35), 0 0 24px rgba(0,242,254,0.14)' : undefined,
        }}
      >
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
          <p className="text-xs mt-2" style={{ color: colors.subText }}>Step {step} of 6</p>
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

          {step < 6 ? (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: colors.accent, color: theme === 'dark' ? '#001018' : '#FFFFFF', opacity: canProceedStep(step) ? 1 : 0.6 }}
              onClick={() => setStep((s) => Math.min(6, s + 1))}
              disabled={!canProceedStep(step)}
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
        {!canProceedStep(step) ? (
          <p className="px-6 pb-3 text-xs" style={{ color: '#EF4444' }}>
            {stepErrors[step as 1 | 2 | 3 | 4 | 5 | 6]?.[0] || 'Please complete required fields before continuing.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
