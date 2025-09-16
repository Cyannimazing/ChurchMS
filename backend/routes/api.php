<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\ChurchSubscriptionController;
use App\Http\Controllers\ChurchController;
use App\Http\Controllers\ChurchStaffController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SacramentServiceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AppointmentController;

//USERS
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    Artisan::call('subscriptions:update');
    Artisan::call('churches:unpublish-expired');
    $user = $request->user()->load(['profile.systemRole', 'contact']);
    
    if ($user->profile->system_role_id == 3) {  
        $user->load([
            'churchRole.permissions', 'church'
        ]);
    }
    
    if ($user->profile->system_role_id == 2) {
        $user->load(['churches']);
    }
    
    
    return $user;
});

Route::get('/users_list', [UserController::class, 'index'])->middleware('auth:sanctum');
Route::put('/users/{id}/update-active', [UserController::class, 'updateActiveStatus'])->middleware('auth:sanctum');
Route::get('/users/{id}', [UserController::class, 'show'])->middleware('auth:sanctum');

//SUBSCRIPTION PLANS
Route::get('/subscription-plans', [SubscriptionPlanController::class, 'index']);
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/subscription-plans', [SubscriptionPlanController::class, 'store']);
    Route::put('/subscription-plans/{id}', [SubscriptionPlanController::class, 'update']);
    Route::delete('/subscription-plans/{id}', [SubscriptionPlanController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/church-subscriptions', [ChurchSubscriptionController::class, 'index']);
    Route::post('/church-subscriptions', [ChurchSubscriptionController::class, 'update']);
    Route::delete('/church-subscriptions/pending', [ChurchSubscriptionController::class, 'cancelPending']);
});

//CHURCHES
// Public endpoints for map functionality
Route::get('/churches/{churchId}/sacrament-services', [SacramentServiceController::class, 'getPublicChurchServices'])->name('churches.sacraments.public');
Route::get('/sacrament-services/{serviceId}/schedules-public', [SacramentServiceController::class, 'getPublicServiceSchedules'])->name('sacraments.schedules.public');
Route::get('/sacrament-services/{serviceId}/form-config-public', [SacramentServiceController::class, 'getFormConfiguration'])->name('sacraments.form.public');
Route::get('/schedule-remaining-slots', [SacramentServiceController::class, 'getScheduleRemainingSlots'])->name('schedule.remaining.slots');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/churches', [ChurchController::class, 'store'])->name('churches.store');
    Route::get('/churches/owned', [ChurchController::class, 'showOwnedChurches'])->name('churches.owned');
    Route::get('/churches/public', [ChurchController::class, 'getPublicChurches'])->name('churches.public');
    
    Route::get('/churches', [ChurchController::class, 'index'])->name('churches.index');
    Route::put('/churches/{churchId}/status', [ChurchController::class, 'updateStatus'])->name('churches.updateStatus');
    Route::put('/churches/{churchId}/publish', [ChurchController::class, 'togglePublish'])->name('churches.togglePublish');
    Route::get('/churches/{churchId}/documents', [ChurchController::class, 'reviewDocuments'])->name('churches.reviewDocuments');
    Route::get('/documents/{documentId}', [ChurchController::class, 'downloadDocument'])->name('documents.download');
    Route::get('/churches/{churchId}', [ChurchController::class, 'show'])->name('churches.show');
    Route::get('/churches/{churchId}/profile-picture', [ChurchController::class, 'getProfilePicture'])->name('churches.profilePicture');
    Route::post('/churches/{churchId}/update', [ChurchController::class, 'update'])->name('churches.update');
});

//Staff Management
Route::middleware('auth:sanctum')->group(function () {
    // RolePermissionController Endpoints
    Route::get('/churches-and-roles/{churchName}', [RolePermissionController::class, 'getChurchAndRoles']);
    Route::post('roles', [RolePermissionController::class, 'store']);
    Route::get('roles/{roleId}', [RolePermissionController::class, 'show']);
    Route::put('roles/{roleId}', [RolePermissionController::class, 'update']);
    Route::get('permissions', [RolePermissionController::class, 'getPermissions']);

    // ChurchStaffController Endpoints
    Route::get('/church-and-staff/{churchName}', [ChurchStaffController::class, 'getChurchAndStaff']);
    Route::post('staff', [ChurchStaffController::class, 'store']);
    Route::get('staff/{staffId}', [ChurchStaffController::class, 'show']);
    Route::put('staff/{staffId}', [ChurchStaffController::class, 'update']);
});

//Sacrament Services Management
Route::middleware('auth:sanctum')->group(function () {
    // CRUD operations for sacrament services
    Route::post('/sacrament-services', [SacramentServiceController::class, 'store']);
    Route::put('/sacrament-services/{serviceId}', [SacramentServiceController::class, 'update'])->where('serviceId', '[0-9]+');
    Route::delete('/sacrament-services/{serviceId}', [SacramentServiceController::class, 'destroy'])->where('serviceId', '[0-9]+');
    
    // Get church and its sacrament services (church name route)
    Route::get('/sacrament-services/{churchName}', [SacramentServiceController::class, 'getChurchAndSacramentServices'])->where('churchName', '[A-Za-z0-9\s\-_]+');
    
    // Get a specific sacrament service by ID (numeric route)
    Route::get('/sacrament-services/{serviceId}', [SacramentServiceController::class, 'show'])->where('serviceId', '[0-9]+');
    
    // Form configuration management
    Route::post('/sacrament-services/{serviceId}/form-config', [SacramentServiceController::class, 'saveFormConfiguration'])->where('serviceId', '[0-9]+');
    Route::get('/sacrament-services/{serviceId}/form-config', [SacramentServiceController::class, 'getFormConfiguration'])->where('serviceId', '[0-9]+');
    
    // Schedule management
    Route::get('/sacrament-services/{serviceId}/schedules', [ScheduleController::class, 'getServiceSchedules'])->where('serviceId', '[0-9]+');
    Route::post('/sacrament-services/{serviceId}/schedules', [ScheduleController::class, 'store'])->where('serviceId', '[0-9]+');
    Route::get('/schedules/{scheduleId}', [ScheduleController::class, 'getSchedule'])->where('scheduleId', '[0-9]+');
    Route::put('/schedules/{scheduleId}', [ScheduleController::class, 'update'])->where('scheduleId', '[0-9]+');
    Route::delete('/schedules/{scheduleId}', [ScheduleController::class, 'destroy'])->where('scheduleId', '[0-9]+');
});

//Appointments
Route::middleware('auth:sanctum')->group(function () {
    // Submit appointment application
    Route::post('/sacrament-applications', [AppointmentController::class, 'store'])->name('sacrament-applications.store');
    
    // Get user's appointments
    Route::get('/appointments', [AppointmentController::class, 'getUserAppointments'])->name('appointments.index');
    
    // Get specific appointment details
    Route::get('/appointments/{appointmentId}', [AppointmentController::class, 'show'])->where('appointmentId', '[0-9]+')->name('appointments.show');
    
    // Get church appointments (for church staff)
    Route::get('/church-appointments/{churchName}', [AppointmentController::class, 'getChurchAppointments'])->where('churchName', '[A-Za-z0-9\s\-_]+')->name('church.appointments.index');
    
    // Update appointment status
    Route::put('/appointments/{appointmentId}/status', [AppointmentController::class, 'updateStatus'])->where('appointmentId', '[0-9]+')->name('appointments.updateStatus');
    
    // Save form data for appointment
    Route::post('/appointments/{appointmentId}/staff-form-data', [AppointmentController::class, 'saveFormData'])->where('appointmentId', '[0-9]+')->name('appointments.saveFormData');
    
});
