<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\TradeImportValidationException;
use App\Http\Controllers\Controller;
use App\Models\TradingAccount;
use App\Services\ActivityLogService;
use App\Services\MT4CSVParser;
use App\Services\TradeImportService;
use Illuminate\Http\Request;

class CsvImportController extends Controller
{
    /**
     * Upload and parse MT4/MT5 CSV file
     * POST /api/v1/accounts/{accountId}/import-csv
     */
    public function store(Request $request, int $account_id)
    {
        $user = $request->user();
        $validated = $request->validate([
            'account_id' => 'nullable|exists:trading_accounts,id',
            'csv_file' => 'nullable|file|mimes:csv,txt|max:10240',
            'parsed_trades' => 'nullable|array',
            'idempotency_key' => 'nullable|string|max:120',
        ]);

        $hasCsv = $request->hasFile('csv_file');
        $hasParsed = $request->has('parsed_trades');
        if (($hasCsv && $hasParsed) || (!$hasCsv && !$hasParsed)) {
            return response()->json([
                'success' => false,
                'message' => 'Provide exactly one of csv_file or parsed_trades.',
            ], 422);
        }

        $resolvedAccountId = $account_id ?: ($validated['account_id'] ?? null);
        if (! $resolvedAccountId) {
            return response()->json([
                'success' => false,
                'message' => 'Account id is required.',
            ], 422);
        }

        if (isset($validated['account_id']) && (int) $validated['account_id'] !== (int) $resolvedAccountId) {
            return response()->json([
                'success' => false,
                'message' => 'account_id in body must match route account id.',
            ], 422);
        }

        $account = TradingAccount::where('id', $resolvedAccountId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            // If client pre-parsed trades are provided, use them
            $tradeImportService = new TradeImportService();
            $idempotencyKey = trim((string) ($request->header('Idempotency-Key') ?: ($validated['idempotency_key'] ?? ''))) ?: null;

            if ($request->has('parsed_trades')) {
                $parsed = $request->input('parsed_trades');
                if (!is_array($parsed) || count($parsed) === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No trades provided in parsed_trades',
                    ], 400);
                }

                $result = $tradeImportService->import($parsed, $account, 'parsed', null, $idempotencyKey);
                app(ActivityLogService::class)->log(
                    $account,
                    $user,
                    'import_completed',
                    'Parsed trades import completed',
                    [
                        'source' => 'parsed',
                        'idempotent_replay' => (bool) ($result['idempotent_replay'] ?? false),
                        'batch_uuid' => $result['batch_uuid'] ?? null,
                        'imported' => $result['imported'] ?? 0,
                        'duplicates' => $result['duplicates'] ?? 0,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'Parsed trades imported',
                ]);
            }

            // Otherwise accept uploaded CSV file
            if ($request->hasFile('csv_file')) {
                $csvContent = file_get_contents($request->file('csv_file')->getRealPath());
                $parser = new MT4CSVParser();
                $parseResult = $parser->parse($csvContent);

                if (empty($parseResult['trades'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No valid trades found in CSV',
                        'errors' => $parseResult['errors'],
                    ], 400);
                }

                $result = $tradeImportService->import(
                    $parseResult['trades'],
                    $account,
                    'csv',
                    $request->file('csv_file')->getClientOriginalName(),
                    $idempotencyKey
                );
                app(ActivityLogService::class)->log(
                    $account,
                    $user,
                    'import_completed',
                    'CSV import completed',
                    [
                        'source' => 'csv',
                        'idempotent_replay' => (bool) ($result['idempotent_replay'] ?? false),
                        'file_name' => $request->file('csv_file')->getClientOriginalName(),
                        'batch_uuid' => $result['batch_uuid'] ?? null,
                        'imported' => $result['imported'] ?? 0,
                        'duplicates' => $result['duplicates'] ?? 0,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'CSV imported',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No csv_file or parsed_trades provided',
            ], 400);
        } catch (TradeImportValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [
                    'batch_uuid' => $e->batchUuid,
                    'errors' => $e->rowErrors,
                ],
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'CSV import failed: ' . $e->getMessage(),
            ], 400);
        }
    }
}
