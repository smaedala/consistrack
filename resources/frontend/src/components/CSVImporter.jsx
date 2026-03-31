import React, { useState, useCallback } from 'react'
import axios from 'axios'
import Papa from 'papaparse'

export default function CSVImporter({ accountId, onImportSuccess, onClose }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [parsedTrades, setParsedTrades] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length) {
      parseFile(files[0])
    }
  }, [])

  const handleFileSelect = (e) => {
    if (e.target.files.length) {
      parseFile(e.target.files[0])
    }
  }

  function getFieldLower(row, names) {
    for (const n of names) {
      for (const key of Object.keys(row)) {
        if (key && key.toLowerCase().trim() === n) return row[key]
      }
    }
    // try fuzzy contains
    for (const key of Object.keys(row)) {
      const k = key.toLowerCase()
      for (const n of names) {
        if (k.includes(n)) return row[key]
      }
    }
    return undefined
  }

  function normalizeRow(raw) {
    const r = {}
    const ticket = getFieldLower(raw, ['ticket', 'order', 'id'])
    const symbol = getFieldLower(raw, ['symbol', 'item', 'instrument'])
    const type = getFieldLower(raw, ['type', 'side', 'cmd'])
    const lot = getFieldLower(raw, ['lots', 'lot', 'volume', 'size'])
    const pnl = getFieldLower(raw, ['profit', 'pnl', 'profitusd', 'amount'])
    const closeTime = getFieldLower(raw, ['closetime', 'close time', 'close_time', 'timeclose'])
    const comment = getFieldLower(raw, ['comment', 'label', 'note'])

    r.ticket = ticket || ''
    r.symbol = symbol || ''
    r.type = type ? String(type).trim() : ''
    r.lot_size = lot ? parseFloat(String(lot).replace(/,/g, '')) || 0 : 0
    r.pnl = pnl ? parseFloat(String(pnl).replace(/,/g, '')) || 0 : 0
    r.close_time = closeTime ? String(closeTime).trim() : ''
    r.comment = comment || ''
    r.strategy_tag = extractStrategyTag(r.comment)
    return r
  }

  function extractStrategyTag(comment) {
    if (!comment) return ''
    const patterns = [/Silver Bullet/i, /Judas Swing/i, /London Sweep/i, /OB Reclaim/i]
    for (const p of patterns) {
      const m = comment.match(p)
      if (m) return m[0]
    }
    return ''
  }

  const parseFile = (file) => {
    setError(null)
    setResult(null)
    setParsedTrades(null)
    setPreview(null)

    if (!file.name.match(/\.(csv|txt)$/i)) {
      setError('Please select a CSV or TXT file from MetaTrader')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => (h || '').trim(),
      complete: (res) => {
        if (res.errors && res.errors.length) {
          console.warn('Papa parse warnings', res.errors)
        }

        const rows = res.data || []
        const mapped = rows.map((r) => normalizeRow(r))
        const totalPnl = mapped.reduce((s, t) => s + (Number(t.pnl) || 0), 0)
        setParsedTrades(mapped)
        setPreview({ count: mapped.length, totalPnl, sample: mapped.slice(0, 5) })
      },
      error: (err) => setError(err?.message || 'Failed to parse CSV')
    })
  }

  const uploadParsedTrades = async () => {
    if (!parsedTrades || !parsedTrades.length) {
      setError('No trades to import')
      return
    }
    setIsUploading(true)
    setError(null)

    try {
      const response = await axios.post(`/accounts/${accountId}/import-csv`, { parsed_trades: parsedTrades })
      setResult(response.data.data)
      if (onImportSuccess) onImportSuccess(response.data.data)
      if (onClose) onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import parsed trades')
    } finally {
      setIsUploading(false)
      setParsedTrades(null)
      setPreview(null)
    }
  }

  return (
    <div className="csv-importer">
      <div className="csv-header">
        <h3>📥 Import Trades from MT4/MT5</h3>
        <p>Drag & drop your MetaTrader CSV export here or click to browse</p>
      </div>

      {!preview && !result && (
        <div
          className={`csv-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="csv-uploading">
              <div className="csv-spinner" />
              <p>Uploading and parsing trades...</p>
            </div>
          ) : (
            <>
              <div className="csv-icon">📊</div>
              <p className="csv-main">Drop CSV file here</p>
              <p className="csv-sub">or click to select</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="csv-input"
                disabled={isUploading}
              />
            </>
          )}
        </div>
      )}

      {error && <div className="csv-error">{error}</div>}

      {preview && !result && (
        <div className="csv-preview">
          <div className="csv-preview-summary">
            <strong>Found {preview.count} trades</strong>
            <span>Total PnL: €{preview.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="csv-preview-table">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Lot</th>
                  <th>PnL</th>
                  <th>Close Time</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((t, i) => (
                  <tr key={i}>
                    <td>{t.ticket}</td>
                    <td>{t.symbol}</td>
                    <td>{t.type}</td>
                    <td>{t.lot_size}</td>
                    <td className={t.pnl >= 0 ? 'dash4-green' : 'dash4-red'}>{t.pnl >= 0 ? '+' : ''}{t.pnl}</td>
                    <td>{t.close_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="csv-preview-actions">
            <button type="button" className="csv-confirm-btn" onClick={uploadParsedTrades} disabled={isUploading}>
              {isUploading ? 'Importing...' : 'Confirm Import'}
            </button>
            <button type="button" className="csv-cancel-btn" onClick={() => { setPreview(null); setParsedTrades(null); if (onClose) onClose() }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="csv-result">
          <div className="csv-success">
            <div className="csv-check">✓</div>
            <div>
              <h4>Import Successful!</h4>
              <p>{result.imported} trades imported</p>
              {result.duplicates > 0 && <p className="csv-duplicates">{result.duplicates} duplicates skipped</p>}
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="csv-warnings">
              <h5>Warnings:</h5>
              <ul>
                {result.errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 3 && <li>...and {result.errors.length - 3} more</li>}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="csv-close-btn"
            onClick={() => { setResult(null); if (onClose) onClose() }}
          >
            Close
          </button>
        </div>
      )}

      <div className="csv-help">
        <h5>How to export from MetaTrader:</h5>
        <ol>
          <li>Open your MetaTrader terminal</li>
          <li>Go to <strong>History</strong> tab and select your account</li>
          <li>Right-click → <strong>Save As</strong> CSV format</li>
          <li>Drag the CSV file here or click to upload</li>
        </ol>
      </div>
    </div>
  )
}
