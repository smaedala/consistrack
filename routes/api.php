<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\TradeController;
use App\Http\Controllers\Api\V1\MetricsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('accounts', AccountController::class)->only(['index','show','store']);
    Route::get('accounts/{account}/metrics', [MetricsController::class, 'show']);
    Route::apiResource('accounts.trades', TradeController::class)->shallow()->only(['index','store']);
});

// Public auth routes
use App\Http\Controllers\Api\V1\AuthController;

Route::post('v1/auth/register', [AuthController::class, 'register']);
Route::post('v1/auth/login', [AuthController::class, 'login']);
Route::post('v1/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Public auth routes
Route::prefix('v1')->group(function () {
    Route::post('auth/register', [\App\Http\Controllers\Api\V1\AuthController::class, 'register']);
    Route::post('auth/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login']);
    Route::post('auth/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout'])->middleware('auth:sanctum');
});
