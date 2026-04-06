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
        Schema::create('daily_account_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('trading_accounts')->onDelete('cascade');
            $table->date('trading_day');
            $table->json('metrics');
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'trading_day']);
            $table->index(['account_id', 'computed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_account_stats');
    }
};

