<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
})->name('home');

// Named login route for auth redirects
Route::get('/login', function () {
    return view('app');
})->name('login');

// SPA route
Route::get('/app/{any?}', function () {
    return view('app');
})->where('any', '.*');

// SPA fallback for frontend routes like /register, /dashboard, etc.
// Excludes backend paths handled elsewhere.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum).*$');
