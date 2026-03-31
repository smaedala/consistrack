<?php

namespace App\Services;

use App\Events\TradeCreated;
use App\Models\Trade;
use App\Models\TradingAccount;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TradeImportService
{
    /**
     * Import normalized trades into the given trading account.
     * Accepts an array of trade arrays with keys: symbol,type,lot_size,pnl,close_time,entry_price,exit_price,ticket,strategy_tag
     * Returns array with imported count, duplicates count, errors and created trades
     */
    public function import(array $trades, TradingAccount $account): array
    {
        $imported = [];
        $duplicates = 0;
        $errors = [];

        DB::transaction(function () use ($trades, $account, &$imported, &$duplicates, &$errors) {
            foreach ($trades as $t) {
                try {
                    $ticket = $t['ticket'] ?? null;
                    $symbol = $t['symbol'] ?? null;
                    $type = $t['type'] ?? null;
                    $pnl = isset($t['pnl']) ? $t['pnl'] : null;
                    $closeTime = $t['close_time'] ?? null;

                    // Build duplicate query: prefer external_id (ticket) if present
                    $query = Trade::where('account_id', $account->id);
                    if (!empty($ticket)) {
                        $query = $query->where('external_id', $ticket);
                    } else {
                        $query = $query->where('symbol', $symbol)
                            ->where('type', $type)
                            ->where('pnl', $pnl)
                            ->where('close_time', $closeTime);
                    }

                    if ($query->exists()) {
                        $duplicates++;
                        continue;
                    }

                    $trade = Trade::create([
                        'account_id' => $account->id,
                        'symbol' => $symbol,
                        'type' => $type,
                        'lot_size' => $t['lot_size'] ?? 0,
                        'entry_price' => $t['entry_price'] ?? null,
                        'exit_price' => $t['exit_price'] ?? null,
                        'pnl' => $pnl ?? 0,
                        'close_time' => $closeTime ?? null,
                        'strategy_tag' => $t['strategy_tag'] ?? null,
                        'external_id' => $ticket ?? null,
                    ]);

                    $imported[] = $trade;
                    event(new TradeCreated($trade));
                } catch (\Exception $ex) {
                    $errors[] = $ex->getMessage();
                }
            }
        });

        return [
            'imported' => count($imported),
            'duplicates' => $duplicates,
            'errors' => $errors,
            'trades' => $imported,
        ];
    }
}
