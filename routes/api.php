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
    Route::get('accounts', [AccountController::class, 'index']);
    Route::get('accounts/{account}', [AccountController::class, 'show']);
    Route::post('accounts', [AccountController::class, 'store'])->middleware('throttle:account-write');
    Route::put('accounts/{account}', [AccountController::class, 'update'])->middleware('throttle:account-write');
    Route::patch('accounts/{account}', [AccountController::class, 'update'])->middleware('throttle:account-write');
    Route::get('accounts/{account}/setup-status', [AccountController::class, 'setupStatus']);
    Route::get('accounts/{account}/metrics', [MetricsController::class, 'show']);
    Route::get('accounts/{account}/alerts', [AccountAlertController::class, 'index']);
    Route::patch('accounts/{account}/alerts/{alert}/acknowledge', [AccountAlertController::class, 'acknowledge'])->middleware('throttle:account-write');
    Route::patch('accounts/{account}/alerts/{alert}/snooze', [AccountAlertController::class, 'snooze'])->middleware('throttle:account-write');
    Route::get('accounts/{account}/activity', [AccountActivityController::class, 'index']);
    Route::get('accounts/{account}/trades', [TradeController::class, 'index']);
    Route::post('accounts/{account}/trades', [TradeController::class, 'store'])->middleware('throttle:trade-write');
    Route::post('accounts/{account}/trades/preview', [TradeController::class, 'preview'])->middleware('throttle:trade-write');
    
    // CSV Import endpoint
    Route::post('accounts/{account_id}/import-csv', [CsvImportController::class, 'store'])->middleware('throttle:import-write');
    Route::get('accounts/{account}/imports', [ImportBatchController::class, 'index']);
    Route::delete('accounts/{account}/imports/{batchUuid}', [ImportBatchController::class, 'destroy'])->middleware('throttle:import-write');

    // Dashboard endpoints
    Route::get('accounts/{account}/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('accounts/{account}/dashboard/equity-curve', [DashboardController::class, 'equityCurve']);
    Route::get('accounts/{account}/dashboard/recent-trades', [DashboardController::class, 'recentTrades']);
    Route::get('accounts/{account}/dashboard/performance-by-symbol', [DashboardController::class, 'performanceBySymbol']);
    Route::get('accounts/{account}/dashboard/win-loss-distribution', [DashboardController::class, 'winLossDistribution']);
    Route::get('accounts/{account}/dashboard/trading-activity', [DashboardController::class, 'tradingActivityCalendar']);
    
    // Trading Rules endpoints
    Route::get('rules', [RuleController::class, 'index']);
    Route::post('rules', [RuleController::class, 'store'])->middleware('throttle:rule-write');
    Route::put('rules/{rule}', [RuleController::class, 'update'])->middleware('throttle:rule-write');
    Route::patch('rules/{rule}', [RuleController::class, 'update'])->middleware('throttle:rule-write');
    Route::delete('rules/{rule}', [RuleController::class, 'destroy'])->middleware('throttle:rule-write');
    Route::get('accounts/{account}/rules', [RuleController::class, 'show']);
    
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

// Public auth routes
Route::prefix('v1')->middleware('throttle:auth-public')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});
