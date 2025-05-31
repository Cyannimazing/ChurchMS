<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ChurchProfile', function (Blueprint $table) {
            // Add new column for profile picture path
            $table->string('ProfilePicturePath')->nullable();
            
            // Drop the old binary column
            $table->dropColumn('ProfilePictureData');
        });
    }

    public function down(): void
    {
        Schema::table('ChurchProfile', function (Blueprint $table) {
            // Recreate the old binary column
            $table->binary('ProfilePictureData')->nullable();
            
            // Drop the new path column
            $table->dropColumn('ProfilePicturePath');
        });
    }
};

