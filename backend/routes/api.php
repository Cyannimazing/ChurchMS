<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\ChurchSubscriptionController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    Artisan::call('subscriptions:update');
    return $request->user()->load(['profile.systemRole', 'contact']);
});

Route::get('/subscription-plans', [SubscriptionPlanController::class, 'index']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/subscription-plans', [SubscriptionPlanController::class, 'store']);
    Route::put('/subscription-plans/{id}', [SubscriptionPlanController::class, 'update']);
    Route::delete('/subscription-plans/{id}', [SubscriptionPlanController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/church-subscriptions', [ChurchSubscriptionController::class, 'index']);
    Route::post('/church-subscriptions', [ChurchSubscriptionController::class, 'update']);
    Route::delete('/church-subscriptions/pending', [ChurchSubscriptionController::class, 'cancelPending']);
});
