<?php

namespace App\Services;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\TradeImportBatch;
use App\Jobs\EvaluateAccountMetricsJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TradeImportService
{
    /**
     * Import normalized trades into the given trading account.
     * Accepts an array of trade arrays with keys: symbol,type,lot_size,pnl,close_time,entry_price,exit_price,ticket,strategy_tag
     * Returns array with batch + import stats.
     */
    public function import(
        array $trades,
        TradingAccount $account,
        string $source = 'csv',
        ?string $fileName = null
    ): array
    {
        $importedCount = 0;
        $duplicates = 0;
        $totalRows = count($trades);

        $batch = TradeImportBatch::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'source' => $source,
            'file_name' => $fileName,
            'status' => 'pending',
            'total_rows' => $totalRows,
        ]);

        try {
            DB::transaction(function () use ($trades, $account, $batch, &$importedCount, &$duplicates): void {
                foreach ($trades as $index => $t) {
                    $ticket = $t['ticket'] ?? $t['external_id'] ?? null;
                    $symbol = strtoupper(trim((string) ($t['symbol'] ?? '')));
                    $type = strtolower(trim((string) ($t['type'] ?? '')));
                    $pnl = $t['pnl'] ?? null;
                    $closeTime = $t['close_time'] ?? null;

                    if ($symbol === '' || ! in_array($type, ['buy', 'sell'], true) || $pnl === null || $closeTime === null) {
                        $line = $index + 1;
                        throw new \RuntimeException("Invalid trade payload at row {$line}");
                    }

                    // Build duplicate query: prefer external_id (ticket) if present.
                    $query = Trade::where('account_id', $account->id);
                    if (! empty($ticket)) {
                        $query->where('external_id', $ticket);
                    } else {
                        $query->where('symbol', $symbol)
                            ->where('type', $type)
                            ->where('pnl', $pnl)
                            ->where('close_time', $closeTime);
                    }

                    if ($query->exists()) {
                        $duplicates++;
                        continue;
                    }

                    Trade::create([
                        'account_id' => $account->id,
                        'import_batch_id' => $batch->id,
                        'symbol' => $symbol,
                        'type' => $type,
                        'lot_size' => $t['lot_size'] ?? 0,
                        'entry_price' => $t['entry_price'] ?? $t['open_price'] ?? null,
                        'exit_price' => $t['exit_price'] ?? $t['close_price'] ?? null,
                        'pnl' => $pnl,
                        'close_time' => $closeTime,
                        'strategy_tag' => $t['strategy_tag'] ?? null,
                        'external_id' => $ticket ?? null,
                    ]);

                    $importedCount++;
                }

                // Recalculate metrics only once after the whole import transaction.
                DB::afterCommit(function () use ($account): void {
                    EvaluateAccountMetricsJob::dispatch($account->id);
                });
            });
        } catch (\Throwable $e) {
            $batch->update([
                'status' => 'failed',
                'imported_count' => 0,
                'duplicate_count' => 0,
                'error_count' => 1,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }

        $batch->update([
            'status' => 'completed',
            'imported_count' => $importedCount,
            'duplicate_count' => $duplicates,
            'error_count' => 0,
            'imported_at' => now(),
        ]);

        return [
            'batch_id' => $batch->id,
            'batch_uuid' => $batch->uuid,
            'batch_status' => $batch->status,
            'source' => $batch->source,
            'total_rows' => $totalRows,
            'imported' => $importedCount,
            'duplicates' => $duplicates,
            'errors' => [],
        ];
    }
}
