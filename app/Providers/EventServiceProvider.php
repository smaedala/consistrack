<?php

namespace App\Providers;

use App\Events\TradeCreated;
use App\Listeners\DispatchEvaluateAccountMetrics;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings.
     *
     * @var array
     */
    protected $listen = [
        TradeCreated::class => [
            DispatchEvaluateAccountMetrics::class,
        ],
    ];
    
    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \App\Models\TradingAccount::class => \App\Policies\TradingAccountPolicy::class,
    ];
}
