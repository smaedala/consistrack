<?php

namespace App\Services;

use App\Exceptions\TradeImportValidationException;
use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\TradeImportBatch;
use App\Jobs\EvaluateAccountMetricsJob;
use Carbon\Carbon;
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
        ?string $fileName = null,
        ?string $idempotencyKey = null
    ): array
    {
        if ($idempotencyKey) {
            $existing = TradeImportBatch::where('account_id', $account->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                if ($existing->status === 'pending') {
                    throw new \RuntimeException('An import with this idempotency key is still processing.');
                }

                return [
                    'batch_id' => $existing->id,
                    'batch_uuid' => $existing->uuid,
                    'batch_status' => $existing->status,
                    'source' => $existing->source,
                    'total_rows' => (int) $existing->total_rows,
                    'imported' => (int) $existing->imported_count,
                    'duplicates' => (int) $existing->duplicate_count,
                    'errors' => (array) data_get($existing->meta, 'row_errors', []),
                    'idempotent_replay' => true,
                ];
            }
        }

        $importedCount = 0;
        $duplicates = 0;
        $totalRows = count($trades);
        $rowErrors = [];
        $normalizedTrades = [];

        foreach ($trades as $index => $tradeRow) {
            $line = $index + 1;
            [$normalized, $error] = $this->normalizeAndValidateRow($tradeRow, $line);
            if ($error !== null) {
                $rowErrors[] = [
                    'row' => $line,
                    'message' => $error,
                ];
                continue;
            }
            $normalizedTrades[] = $normalized;
        }

        $batch = TradeImportBatch::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'source' => $source,
            'file_name' => $fileName,
            'idempotency_key' => $idempotencyKey,
            'status' => 'pending',
            'total_rows' => $totalRows,
        ]);

        if (!empty($rowErrors)) {
            $batch->update([
                'status' => 'failed',
                'imported_count' => 0,
                'duplicate_count' => 0,
                'error_count' => count($rowErrors),
                'error_message' => 'Import validation failed.',
                'meta' => [
                    'row_errors' => $rowErrors,
                ],
            ]);

            throw new TradeImportValidationException(
                'Import validation failed.',
                rowErrors: $rowErrors,
                batchUuid: $batch->uuid
            );
        }

        try {
            DB::transaction(function () use ($normalizedTrades, $account, $batch, &$importedCount, &$duplicates): void {
                foreach ($normalizedTrades as $t) {
                    $ticket = $t['ticket'] ?? $t['external_id'] ?? null;
                    $symbol = strtoupper(trim((string) ($t['symbol'] ?? '')));
                    $type = strtolower(trim((string) ($t['type'] ?? '')));
                    $pnl = $t['pnl'] ?? null;
                    $closeTime = $t['close_time'] ?? null;

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
                    // Run immediately so imported results appear live without queue-worker dependency.
                    EvaluateAccountMetricsJob::dispatchSync($account->id);
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
            'idempotent_replay' => false,
        ];
    }

    /**
     * @return array{0: array<string,mixed>, 1: string|null}
     */
    protected function normalizeAndValidateRow(array $t, int $line): array
    {
        $symbol = strtoupper(trim((string) ($t['symbol'] ?? '')));
        $type = strtolower(trim((string) ($t['type'] ?? '')));
        $pnl = $t['pnl'] ?? null;
        $closeTime = $t['close_time'] ?? null;
        $ticket = $t['ticket'] ?? $t['external_id'] ?? null;

        if ($symbol === '') {
            return [[], "Row {$line}: symbol is required."];
        }
        if (!preg_match('/^[A-Za-z0-9._-]{3,20}$/', $symbol)) {
            return [[], "Row {$line}: symbol format is invalid."];
        }
        if (!in_array($type, ['buy', 'sell'], true)) {
            return [[], "Row {$line}: type must be buy or sell."];
        }
        if (!is_numeric($pnl)) {
            return [[], "Row {$line}: pnl must be numeric."];
        }
        if ($closeTime === null || $closeTime === '') {
            return [[], "Row {$line}: close_time is required."];
        }

        try {
            $normalizedCloseTime = Carbon::parse((string) $closeTime)->utc()->startOfSecond()->toDateTimeString();
        } catch (\Throwable) {
            return [[], "Row {$line}: close_time is invalid."];
        }

        $lotSize = $t['lot_size'] ?? 0;
        if (!is_numeric($lotSize) || (float) $lotSize < 0) {
            return [[], "Row {$line}: lot_size must be a non-negative number."];
        }

        return [[
            'symbol' => $symbol,
            'type' => $type,
            'lot_size' => (float) $lotSize,
            'entry_price' => isset($t['entry_price']) && is_numeric($t['entry_price']) ? (float) $t['entry_price'] : ($t['open_price'] ?? null),
            'exit_price' => isset($t['exit_price']) && is_numeric($t['exit_price']) ? (float) $t['exit_price'] : ($t['close_price'] ?? null),
            'pnl' => (float) $pnl,
            'close_time' => $normalizedCloseTime,
            'strategy_tag' => $t['strategy_tag'] ?? null,
            'external_id' => $ticket,
            'ticket' => $ticket,
        ], null];
    }
}
