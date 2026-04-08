<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\Trade;
use App\Models\TradeImportBatch;
use App\Models\TradingAccount;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImportBatchController extends Controller
{
    /**
     * List import batches for an account.
     * GET /api/v1/accounts/{account}/imports
     */
    public function index(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $perPage = min(50, max(5, (int) $request->integer('per_page', 10)));
        $batches = TradeImportBatch::where('account_id', $account->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $batches,
            'message' => 'Import batches retrieved',
        ]);
    }

    /**
     * Undo a previous import batch for the given account.
     * DELETE /api/v1/accounts/{account}/imports/{batchUuid}
     */
    public function destroy(Request $request, TradingAccount $account, string $batchUuid)
    {
        $this->authorize('update', $account);

        $batch = TradeImportBatch::where('account_id', $account->id)
            ->where('uuid', $batchUuid)
            ->firstOrFail();

        if ($batch->status === 'reverted') {
            return response()->json([
                'success' => true,
                'data' => [
                    'batch_uuid' => $batch->uuid,
                    'deleted_trades' => 0,
                ],
                'message' => 'Import batch already reverted',
            ]);
        }

        $deletedTrades = 0;

        DB::transaction(function () use ($account, $batch, &$deletedTrades): void {
            $deletedTrades = Trade::where('account_id', $account->id)
                ->where('import_batch_id', $batch->id)
                ->delete();

            $batch->update([
                'status' => 'reverted',
                'reverted_at' => now(),
                'meta' => array_merge((array) $batch->meta, [
                    'reverted_deleted_trades' => $deletedTrades,
                ]),
            ]);
        });

        // Recompute immediately after rollback so UI reflects reverted batch right away.
        EvaluateAccountMetricsJob::dispatchSync($account->id);
        app(ActivityLogService::class)->log(
            $account,
            $request->user(),
            'import_reverted',
            'Import batch reverted',
            [
                'batch_uuid' => $batch->uuid,
                'deleted_trades' => $deletedTrades,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'batch_uuid' => $batch->uuid,
                'deleted_trades' => $deletedTrades,
            ],
            'message' => 'Import batch reverted',
        ]);
    }
}
