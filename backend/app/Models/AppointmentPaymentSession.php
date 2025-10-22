<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentPaymentSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'church_id',
        'service_id',
        'schedule_id',
        'schedule_time_id',
        'paymongo_session_id',
        'payment_method',
        'amount',
        'currency',
        'status',
        'checkout_url',
        'appointment_date',
        'metadata',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'appointment_date' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class, 'church_id', 'ChurchID');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(SacramentService::class, 'service_id', 'ServiceID');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ServiceSchedule::class, 'schedule_id', 'ScheduleID');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}