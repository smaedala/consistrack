<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trading_accounts', function (Blueprint $table) {
            $table->string('trading_day_reset_timezone')->default('UTC')->after('timezone');
            $table->string('trading_day_reset_time', 5)->default('00:00')->after('trading_day_reset_timezone'); // HH:MM
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trading_accounts', function (Blueprint $table) {
            $table->dropColumn(['trading_day_reset_timezone', 'trading_day_reset_time']);
        });
    }
};

