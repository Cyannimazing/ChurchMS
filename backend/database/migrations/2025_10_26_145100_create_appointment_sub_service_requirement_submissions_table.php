<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_sub_service_requirement_submissions', function (Blueprint $table) {
            $table->id('SubmissionID');
            $table->unsignedBigInteger('AppointmentID');
            $table->unsignedBigInteger('SubServiceRequirementID');
            $table->boolean('isSubmitted')->default(false);
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamps();

            $table->foreign('AppointmentID')->references('AppointmentID')->on('Appointment')->onDelete('cascade');
            $table->foreign('SubServiceRequirementID')->references('RequirementID')->on('sub_service_requirements')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');

            $table->unique(['AppointmentID','SubServiceRequirementID']);
            $table->index(['AppointmentID','SubServiceRequirementID']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_sub_service_requirement_submissions');
    }
};