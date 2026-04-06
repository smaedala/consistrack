<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\TradeController;
use App\Http\Controllers\Api\V1\MetricsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RuleController;
use App\Http\Controllers\Api\V1\CsvImportController;
use App\Http\Controllers\Api\V1\AccountAlertController;
use App\Http\Controllers\Api\V1\ImportBatchController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\AccountActivityController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('accounts', AccountController::class)->only(['index','show','store','update']);
    Route::get('accounts/{account}/metrics', [MetricsController::class, 'show']);
    Route::get('accounts/{account}/alerts', [AccountAlertController::class, 'index']);
    Route::get('accounts/{account}/activity', [AccountActivityController::class, 'index']);
    Route::apiResource('accounts.trades', TradeController::class)->shallow()->only(['index','store']);
    Route::post('accounts/{account}/trades/preview', [TradeController::class, 'preview']);
    
    // CSV Import endpoint
    Route::post('accounts/{account_id}/import-csv', [CsvImportController::class, 'store']);
    Route::get('accounts/{account}/imports', [ImportBatchController::class, 'index']);
    Route::delete('accounts/{account}/imports/{batchUuid}', [ImportBatchController::class, 'destroy']);

    // Dashboard endpoints
    Route::get('accounts/{account}/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('accounts/{account}/dashboard/equity-curve', [DashboardController::class, 'equityCurve']);
    Route::get('accounts/{account}/dashboard/recent-trades', [DashboardController::class, 'recentTrades']);
    Route::get('accounts/{account}/dashboard/performance-by-symbol', [DashboardController::class, 'performanceBySymbol']);
    Route::get('accounts/{account}/dashboard/win-loss-distribution', [DashboardController::class, 'winLossDistribution']);
    
    // Trading Rules endpoints
    Route::apiResource('rules', RuleController::class)->only(['index','store','update','destroy']);
    Route::get('accounts/{account}/rules', [RuleController::class, 'show']);
    
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

// Public auth routes
Route::prefix('v1')->middleware('throttle:30,1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});
