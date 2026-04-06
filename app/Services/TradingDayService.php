<?php

namespace App\Services;

use App\Models\TradingAccount;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class TradingDayService
{
    public function tradingDayKeyNow(TradingAccount $account): string
    {
        return $this->tradingDayKeyForTimestamp($account, now());
    }

    public function tradingDayKeyForTimestamp(TradingAccount $account, CarbonInterface $timestamp): string
    {
        [$resetHour, $resetMinute] = $this->resetParts($account);
        $resetTimezone = $this->resetTimezone($account);

        $local = Carbon::instance($timestamp)->setTimezone($resetTimezone);
        $dayAnchor = $local->copy();

        // If trade happened before reset time, it belongs to the previous trading day.
        if (
            (int) $local->format('H') < $resetHour
            || ((int) $local->format('H') === $resetHour && (int) $local->format('i') < $resetMinute)
        ) {
            $dayAnchor->subDay();
        }

        return $dayAnchor->toDateString();
    }

    /**
     * Returns UTC window [start, end) for a trading day key in account reset timezone.
     *
     * @return array{start: Carbon, end: Carbon}
     */
    public function tradingDayWindowUtc(TradingAccount $account, string $tradingDayKey): array
    {
        [$resetHour, $resetMinute] = $this->resetParts($account);
        $resetTimezone = $this->resetTimezone($account);

        $startLocal = Carbon::createFromFormat('Y-m-d H:i', "{$tradingDayKey} {$this->resetTime($account)}", $resetTimezone)
            ->setSecond(0);
        $endLocal = $startLocal->copy()->addDay();

        return [
            'start' => $startLocal->copy()->utc(),
            'end' => $endLocal->copy()->utc(),
        ];
    }

    protected function resetTimezone(TradingAccount $account): string
    {
        return $account->trading_day_reset_timezone ?: ($account->timezone ?: 'UTC');
    }

    protected function resetTime(TradingAccount $account): string
    {
        return $account->trading_day_reset_time ?: '00:00';
    }

    /**
     * @return array{0:int,1:int}
     */
    protected function resetParts(TradingAccount $account): array
    {
        [$hour, $minute] = explode(':', $this->resetTime($account)) + [0, 0];
        return [(int) $hour, (int) $minute];
    }
}
