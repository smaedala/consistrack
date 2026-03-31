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
        Schema::create('trading_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('trading_account_id')->nullable()->constrained()->onDelete('cascade');
            
            // Rule Configuration
            $table->decimal('starting_balance', 16, 2)->default(100000);
            $table->decimal('profit_target_percent', 8, 2)->default(10); // 10% profit target
            $table->decimal('max_daily_loss_percent', 8, 2)->default(5); // 5% daily loss limit
            $table->string('consistency_rule_type')->default('40'); // 40%, 15%, or custom
            $table->decimal('consistency_threshold_percent', 8, 2)->default(40); // Highest day % threshold
            $table->decimal('max_single_trade_percent', 8, 2)->nullable(); // Optional: max % per trade
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            
            $table->timestamps();
            $table->unique(['user_id', 'trading_account_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trading_rules');
    }
};
