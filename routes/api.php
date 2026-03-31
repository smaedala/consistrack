<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\TradeController;
use App\Http\Controllers\Api\V1\MetricsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RuleController;
use App\Http\Controllers\Api\V1\CsvImportController;
use App\Http\Controllers\Api\V1\AccountAlertController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('accounts', AccountController::class)->only(['index','show','store','update']);
    Route::get('accounts/{account}/metrics', [MetricsController::class, 'show']);
    Route::get('accounts/{account}/alerts', [AccountAlertController::class, 'index']);
    Route::apiResource('accounts.trades', TradeController::class)->shallow()->only(['index','store']);
    
    // CSV Import endpoint
    Route::post('accounts/{account_id}/import-csv', [CsvImportController::class, 'store']);
    
    // Trading Rules endpoints
    Route::apiResource('rules', RuleController::class)->only(['index','store','update','destroy']);
    Route::get('accounts/{account}/rules', [RuleController::class, 'show']);
    
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

// Public auth routes
Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});
