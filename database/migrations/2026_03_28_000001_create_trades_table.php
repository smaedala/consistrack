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
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('trading_accounts')->onDelete('cascade');
            $table->string('symbol');
            $table->enum('type', ['buy', 'sell']);
            $table->decimal('lot_size', 8, 2)->nullable();
            $table->decimal('entry_price', 15, 5)->nullable();
            $table->decimal('exit_price', 15, 5)->nullable();
            $table->decimal('pnl', 15, 2);
            $table->dateTime('close_time');
            $table->string('strategy_tag')->nullable();
            $table->string('external_id')->nullable()->index();
            $table->timestamps();
        });

        Schema::table('trades', function (Blueprint $table) {
            $table->index(['account_id', 'close_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
