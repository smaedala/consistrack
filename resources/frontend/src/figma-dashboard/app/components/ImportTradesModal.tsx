import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { FileUp, UploadCloud, X } from 'lucide-react';

type ImportTradesModalProps = {
  open: boolean;
  accountId: number | null;
  theme: 'dark' | 'light';
  onClose: () => void;
  onImported?: () => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  onOpenGuide?: () => void;
  guideProgress?: {
    accountCreated: boolean;
    rulesConfigured: boolean;
    firstTradeAdded: boolean;
    firstImportCompleted: boolean;
  };
};

type ParsedTrade = {
  ticket: string;
  symbol: string;
  type: string;
  lot_size: number;
  pnl: number;
  close_time: string;
  strategy_tag: string;
};

type BrokerPreset = 'auto' | 'mt4' | 'mt5' | 'ctrader' | 'dxtrade';

export function ImportTradesModal({ open, accountId, theme, onClose, onImported, onNotify, onOpenGuide, guideProgress }: ImportTradesModalProps) {
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ count: number; totalPnl: number; sample: ParsedTrade[] } | null>(null);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[] | null>(null);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoLoadingUuid, setUndoLoadingUuid] = useState<string | null>(null);
  const [brokerPreset, setBrokerPreset] = useState<BrokerPreset>('auto');
  const progress = guideProgress ?? {
    accountCreated: false,
    rulesConfigured: false,
    firstTradeAdded: false,
    firstImportCompleted: false,
  };

  const palette = useMemo(
    () =>
      theme === 'dark'
        ? {
            overlay: 'rgba(4, 8, 16, 0.7)',
            bg: '#1E2025',
            border: '#2A2D35',
            text: '#F4F7FB',
            subText: '#9CA3AF',
            field: '#121724',
            accent: '#00F2FE',
            success: '#10B981',
            danger: '#EF4444',
          }
        : {
            overlay: 'rgba(17, 24, 39, 0.35)',
            bg: '#FFFFFF',
            border: '#E5E7EB',
            text: '#0F172A',
            subText: '#64748B',
            field: '#F8FAFC',
            accent: '#0EA5E9',
            success: '#10B981',
            danger: '#EF4444',
          },
    [theme]
  );

  function resetState() {
    setError(null);
    setPreview(null);
    setParsedTrades(null);
    setResult(null);
    setIsUploading(false);
    setDragging(false);
  }

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, accountId]);

  if (!open) return null;

  async function loadHistory() {
    if (!accountId) {
      setHistory([]);
      return;
    }
    try {
      const res = await axios.get(`/accounts/${accountId}/imports`, { params: { per_page: 5 } });
      const rows = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
      setHistory(rows);
    } catch {
      setHistory([]);
    }
  }

  function getFieldLower(row: Record<string, any>, names: string[]) {
    for (const n of names) {
      for (const key of Object.keys(row)) {
        if (key && key.toLowerCase().trim() === n) return row[key];
      }
    }
    for (const key of Object.keys(row)) {
      const k = key.toLowerCase();
      for (const n of names) {
        if (k.includes(n)) return row[key];
      }
    }
    return undefined;
  }

  function extractStrategyTag(comment: string, preset: BrokerPreset = 'auto') {
    if (!comment) return '';
    const presetPatterns: Record<BrokerPreset, RegExp[]> = {
      auto: [/Silver Bullet/i, /Judas Swing/i, /London Sweep/i, /OB Reclaim/i, /FVG/i, /Breaker/i],
      mt4: [/SB/i, /Judas/i, /London/i, /OB/i],
      mt5: [/Silver Bullet/i, /Judas Swing/i, /Killzone/i, /FVG/i],
      ctrader: [/Liquidity Sweep/i, /Order Block/i, /MSS/i, /PO3/i],
      dxtrade: [/Reversal/i, /Continuation/i, /Trend Pullback/i, /Range Expansion/i],
    };
    const patterns = presetPatterns[preset] || presetPatterns.auto;
    for (const p of patterns) {
      const m = comment.match(p);
      if (m) return m[0];
    }
    return '';
  }

  function normalizeRow(raw: Record<string, any>, preset: BrokerPreset): ParsedTrade {
    const ticket = getFieldLower(raw, ['ticket', 'order', 'id']);
    const symbol = getFieldLower(raw, ['symbol', 'item', 'instrument']);
    const type = getFieldLower(raw, ['type', 'side', 'cmd']);
    const lot = getFieldLower(raw, ['lots', 'lot', 'volume', 'size']);
    const pnl = getFieldLower(raw, ['profit', 'pnl', 'profitusd', 'amount']);
    const closeTime = getFieldLower(raw, ['closetime', 'close time', 'close_time', 'timeclose']);
    const comment = getFieldLower(raw, ['comment', 'label', 'note']);

    const normalizedType = String(type || '').toLowerCase().includes('sell') ? 'sell' : 'buy';

    return {
      ticket: ticket || '',
      symbol: String(symbol || '').toUpperCase() || 'UNKNOWN',
      type: normalizedType,
      lot_size: lot ? parseFloat(String(lot).replace(/,/g, '')) || 0 : 0,
      pnl: pnl ? parseFloat(String(pnl).replace(/,/g, '')) || 0 : 0,
      close_time: closeTime ? String(closeTime).trim() : new Date().toISOString(),
      strategy_tag: extractStrategyTag(String(comment || ''), preset),
    };
  }

  function parseFile(file: File) {
    setError(null);
    setResult(null);
    setParsedTrades(null);
    setPreview(null);

    if (!file.name.match(/\.(csv|txt)$/i)) {
      setError('Please select a CSV or TXT file from MetaTrader.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => (h || '').trim(),
      complete: (res) => {
        const rows = (res.data || []) as Record<string, any>[];
        const mapped = rows.map((r) => normalizeRow(r, brokerPreset));
        const totalPnl = mapped.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        setParsedTrades(mapped);
        setPreview({ count: mapped.length, totalPnl, sample: mapped.slice(0, 7) });
      },
      error: (err) => setError(err?.message || 'Failed to parse CSV'),
    });
  }

  async function importParsedTrades() {
    if (!accountId) {
      setError('No account found. Finish account setup first.');
      return;
    }
    if (!parsedTrades || parsedTrades.length === 0) {
      setError('No trades to import.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const response = await axios.post(`/accounts/${accountId}/import-csv`, { parsed_trades: parsedTrades });
      setResult(response.data?.data ?? null);
      onImported?.();
      onNotify?.('success', `Import completed: ${Number(response.data?.data?.imported || 0)} trades added.`);
      await loadHistory();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to import trades';
      setError(message);
      onNotify?.('error', message);
    } finally {
      setIsUploading(false);
    }
  }

  async function undoBatch(batchUuid: string) {
    if (!accountId) return;
    setUndoLoadingUuid(batchUuid);
    setError(null);
    try {
      await axios.delete(`/accounts/${accountId}/imports/${batchUuid}`);
      onImported?.();
      onNotify?.('success', 'Import batch reverted successfully.');
      await loadHistory();
      setResult(null);
      setPreview(null);
      setParsedTrades(null);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to undo import';
      setError(message);
      onNotify?.('error', message);
    } finally {
      setUndoLoadingUuid(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: palette.overlay }}>
      <div className="w-full max-w-3xl rounded-2xl border shadow-2xl" style={{ backgroundColor: palette.bg, borderColor: palette.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: palette.border }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: palette.text }}>Import MT4/MT5</h3>
            <p className="text-xs mt-1" style={{ color: palette.subText }}>Upload your exported statement and preview before import.</p>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="h-9 w-9 rounded-lg border flex items-center justify-center"
            style={{ borderColor: palette.border, color: palette.subText }}
            aria-label="Close import modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!progress.rulesConfigured ? (
            <div
              className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3"
              style={{ borderColor: `${palette.accent}66`, backgroundColor: `${palette.accent}12` }}
            >
              <p className="text-xs" style={{ color: palette.subText }}>
                Tip: Configure risk rules first for best consistency and drawdown tracking after import.
              </p>
              <button
                type="button"
                className="px-2 py-1 rounded-md border text-xs font-medium"
                style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.field }}
                onClick={() => onOpenGuide?.()}
              >
                Open Guide
              </button>
            </div>
          ) : null}
          {!preview && !result ? (
            <div className="space-y-3">
              <label className="text-sm block" style={{ color: palette.subText }}>
                Broker/Platform Preset
                <select
                  value={brokerPreset}
                  onChange={(e) => setBrokerPreset(e.target.value as BrokerPreset)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  style={{ backgroundColor: palette.field, borderColor: palette.border, color: palette.text }}
                >
                  <option value="auto">Auto Detect</option>
                  <option value="mt4">MetaTrader 4</option>
                  <option value="mt5">MetaTrader 5</option>
                  <option value="ctrader">cTrader</option>
                  <option value="dxtrade">DXtrade</option>
                </select>
              </label>

              <label
                className="block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragging ? palette.accent : palette.border,
                  backgroundColor: palette.field,
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) parseFile(file);
                }}
              >
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseFile(file);
                  }}
                />
                <UploadCloud size={28} style={{ color: palette.accent, margin: '0 auto 10px auto' }} />
                <p style={{ color: palette.text, fontWeight: 600 }}>Drop CSV here or click to browse</p>
                <p className="text-sm mt-1" style={{ color: palette.subText }}>MT4/MT5 history export (.csv or .txt)</p>
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm" style={{ color: palette.danger }}>{error}</p> : null}

          {preview && !result ? (
            <div className="rounded-xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.field }}>
              <div className="flex items-center justify-between">
                <strong style={{ color: palette.text }}>{preview.count} trades detected</strong>
                <span style={{ color: preview.totalPnl >= 0 ? palette.success : palette.danger, fontSize: 13 }}>
                  Total PnL: {preview.totalPnl >= 0 ? '+' : ''}${preview.totalPnl.toFixed(2)}
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                      <th className="text-left py-2" style={{ color: palette.subText }}>Symbol</th>
                      <th className="text-left py-2" style={{ color: palette.subText }}>Type</th>
                      <th className="text-right py-2" style={{ color: palette.subText }}>Lot</th>
                      <th className="text-right py-2" style={{ color: palette.subText }}>PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((t, i) => (
                      <tr key={`${t.symbol}-${i}`} style={{ borderBottom: `1px solid ${palette.border}` }}>
                        <td className="py-2" style={{ color: palette.text }}>{t.symbol}</td>
                        <td className="py-2" style={{ color: palette.text }}>{t.type.toUpperCase()}</td>
                        <td className="py-2 text-right" style={{ color: palette.text }}>{Number(t.lot_size || 0).toFixed(2)}</td>
                        <td className="py-2 text-right" style={{ color: Number(t.pnl) >= 0 ? palette.success : palette.danger }}>
                          {Number(t.pnl) >= 0 ? '+' : ''}{Number(t.pnl).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor: palette.border, color: palette.subText }}
                  onClick={() => {
                    setPreview(null);
                    setParsedTrades(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                  style={{ backgroundColor: palette.accent, color: theme === 'dark' ? '#001018' : '#FFFFFF', opacity: isUploading ? 0.7 : 1 }}
                  onClick={importParsedTrades}
                  disabled={isUploading}
                >
                  <FileUp size={14} />
                  {isUploading ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border p-4" style={{ borderColor: `${palette.success}66`, backgroundColor: `${palette.success}12` }}>
              <p style={{ color: palette.success, fontWeight: 600 }}>Import successful</p>
              <p className="text-sm mt-1" style={{ color: palette.text }}>
                Imported: {Number(result.imported || 0)} trades
                {Number(result.duplicates || 0) > 0 ? ` • Duplicates skipped: ${Number(result.duplicates)}` : ''}
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: palette.accent, color: theme === 'dark' ? '#001018' : '#FFFFFF' }}
                  onClick={() => {
                    resetState();
                    onClose();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.field }}>
            <div className="flex items-center justify-between">
              <strong style={{ color: palette.text }}>Recent Import History</strong>
              <span className="text-xs" style={{ color: palette.subText }}>Latest 5 batches</span>
            </div>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm" style={{ color: palette.subText }}>No import batches yet.</p>
              ) : (
                history.map((batch) => (
                  <div
                    key={batch.uuid}
                    className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3"
                    style={{ borderColor: palette.border }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: palette.text }}>
                        {batch.file_name || 'Parsed trades'} • {String(batch.status || '').toUpperCase()}
                      </p>
                      <p className="text-xs" style={{ color: palette.subText }}>
                        Imported: {Number(batch.imported_count || 0)} • Duplicates: {Number(batch.duplicate_count || 0)}
                      </p>
                    </div>
                    {batch.status === 'completed' ? (
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                        style={{ borderColor: `${palette.danger}77`, color: palette.danger, backgroundColor: `${palette.danger}12` }}
                        onClick={() => undoBatch(batch.uuid)}
                        disabled={undoLoadingUuid === batch.uuid}
                      >
                        {undoLoadingUuid === batch.uuid ? 'Undoing...' : 'Undo'}
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: palette.subText }}>
                        {batch.status === 'reverted' ? 'Reverted' : 'No action'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
