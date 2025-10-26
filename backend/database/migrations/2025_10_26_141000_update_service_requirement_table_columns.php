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
        Schema::table('service_requirement', function (Blueprint $table) {
            // Rename IsMandatory to isNeeded
            $table->renameColumn('IsMandatory', 'isNeeded');
            
            // Add isSubmitted column
            $table->boolean('isSubmitted')->default(false)->after('isNeeded');
        });
        
        // Update the index to use new column name
        Schema::table('service_requirement', function (Blueprint $table) {
            $table->dropIndex(['ServiceID', 'IsMandatory']);
            $table->index(['ServiceID', 'isNeeded']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_requirement', function (Blueprint $table) {
            // Drop the new column
            $table->dropColumn('isSubmitted');
            
            // Rename back to IsMandatory
            $table->renameColumn('isNeeded', 'IsMandatory');
        });
        
        // Restore the original index
        Schema::table('service_requirement', function (Blueprint $table) {
            $table->dropIndex(['ServiceID', 'isNeeded']);
            $table->index(['ServiceID', 'IsMandatory']);
        });
    }
};