<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\Trade;
use App\Models\TradingAccount;
use Illuminate\Http\Request;

class TradeController extends Controller
{
    public function index(TradingAccount $account)
    {
        $this->authorize('view', $account);
        $trades = $account->trades()->orderByDesc('close_time')->paginate(50);
        return response()->json(['success' => true, 'data' => $trades, 'message' => 'Trades retrieved']);
    }

    public function store(Request $request, TradingAccount $account)
    {
        $this->authorize('update', $account);
        $data = $request->validate([
            'symbol' => 'required|string',
            'type' => 'required|in:buy,sell',
            'lot_size' => 'numeric',
            'entry_price' => 'numeric',
            'exit_price' => 'numeric',
            'pnl' => 'required|numeric',
            'close_time' => 'required|date',
            'strategy_tag' => 'string',
            'external_id' => 'string',
        ]);

        $data['account_id'] = $account->id;

        $trade = Trade::create($data);

        // Fire event for trade created to trigger listeners
        event(new \App\Events\TradeCreated($trade));

        return response()->json(['success' => true, 'data' => $trade, 'message' => 'Trade recorded'], 201);
    }
}
