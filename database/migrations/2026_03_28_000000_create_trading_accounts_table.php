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
        Schema::create('trading_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('account_name');
            $table->decimal('initial_balance', 15, 2);
            $table->decimal('current_balance', 15, 2)->nullable();
            $table->decimal('profit_target', 15, 2)->default(0);
            $table->integer('consistency_rule_percent')->default(40);
            $table->integer('daily_drawdown_limit_percent')->default(5);
            $table->integer('max_loss_limit_percent')->default(10);
            $table->string('timezone')->default('UTC');
            $table->enum('status', ['active', 'passed', 'breached'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trading_accounts');
    }
};
