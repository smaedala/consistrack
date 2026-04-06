<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Trade;
use App\Models\TradingAccount;
use App\Services\AddTradePreviewService;
use App\Services\ActivityLogService;
use Carbon\Carbon;
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
            'symbol' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9._-]{3,20}$/'],
            'type' => 'required|in:buy,sell',
            'lot_size' => 'nullable|numeric|min:0.01|max:1000',
            'entry_price' => 'nullable|numeric|min:0',
            'exit_price' => 'nullable|numeric|min:0',
            'pnl' => 'required|numeric',
            'close_time' => 'required|date|before_or_equal:now',
            'strategy_tag' => 'nullable|string|max:120',
            'external_id' => 'nullable|string|max:120',
        ]);

        $data['account_id'] = $account->id;
        $data['symbol'] = strtoupper(trim($data['symbol']));
        $normalizedCloseTime = Carbon::parse($data['close_time'])->utc()->startOfSecond();
        $data['close_time'] = $normalizedCloseTime->toDateTimeString();

        $duplicateExists = Trade::query()
            ->where('account_id', $account->id)
            ->where('symbol', $data['symbol'])
            ->where('type', $data['type'])
            ->where('pnl', $data['pnl'])
            ->whereBetween('close_time', [
                $normalizedCloseTime->copy()->toDateTimeString(),
                $normalizedCloseTime->copy()->addSecond()->toDateTimeString(),
            ])
            ->when(isset($data['lot_size']), fn($q) => $q->where('lot_size', $data['lot_size']))
            ->exists();

        if ($duplicateExists) {
            return response()->json([
                'success' => false,
                'message' => 'Duplicate trade detected. This trade already exists for this account.',
            ], 409);
        }

        $trade = Trade::create($data);

        // Fire event for trade created to trigger listeners
        event(new \App\Events\TradeCreated($trade));

        app(ActivityLogService::class)->log(
            $account,
            $request->user(),
            'trade_added',
            'Manual trade added',
            [
                'trade_id' => $trade->id,
                'symbol' => $trade->symbol,
                'type' => $trade->type,
                'pnl' => (float) $trade->pnl,
                'close_time' => optional($trade->close_time)?->toISOString(),
            ]
        );

        return response()->json(['success' => true, 'data' => $trade, 'message' => 'Trade recorded'], 201);
    }

    public function preview(Request $request, TradingAccount $account, AddTradePreviewService $previewService)
    {
        $this->authorize('update', $account);

        $data = $request->validate([
            'pnl' => 'required|numeric',
            'close_time' => 'nullable|date',
        ]);

        $preview = $previewService->preview(
            $account,
            (float) $data['pnl'],
            isset($data['close_time']) ? Carbon::parse($data['close_time']) : null
        );

        return response()->json([
            'success' => true,
            'data' => $preview,
            'message' => 'Trade preview generated',
        ]);
    }
}
