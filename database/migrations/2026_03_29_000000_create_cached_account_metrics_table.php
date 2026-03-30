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
        Schema::create('cached_account_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('trading_accounts')->onDelete('cascade');
            $table->json('metrics');
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cached_account_metrics');
    }
};
