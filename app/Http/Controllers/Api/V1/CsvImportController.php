<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TradingAccount;
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
        ]);

        $resolvedAccountId = $account_id ?: ($validated['account_id'] ?? null);
        if (! $resolvedAccountId) {
            return response()->json(['message' => 'Account id is required.'], 422);
        }

        $account = TradingAccount::where('id', $resolvedAccountId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            // If client pre-parsed trades are provided, use them
            $tradeImportService = new TradeImportService();

            if ($request->has('parsed_trades')) {
                $parsed = $request->input('parsed_trades');
                if (!is_array($parsed) || count($parsed) === 0) {
                    return response()->json(['message' => 'No trades provided in parsed_trades'], 400);
                }

                $result = $tradeImportService->import($parsed, $account);

                return response()->json(['data' => $result, 'message' => 'Parsed trades imported']);
            }

            // Otherwise accept uploaded CSV file
            if ($request->hasFile('csv_file')) {
                $csvContent = file_get_contents($request->file('csv_file')->getRealPath());
                $parser = new MT4CSVParser();
                $parseResult = $parser->parse($csvContent);

                if (empty($parseResult['trades'])) {
                    return response()->json([
                        'message' => 'No valid trades found in CSV',
                        'errors' => $parseResult['errors'],
                    ], 400);
                }

                $result = $tradeImportService->import($parseResult['trades'], $account);

                return response()->json(['data' => $result, 'message' => 'CSV imported']);
            }

            return response()->json(['message' => 'No csv_file or parsed_trades provided'], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'CSV import failed: ' . $e->getMessage(),
            ], 400);
        }
    }
}
