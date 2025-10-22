<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChurchTransaction extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'ChurchTransactionID';
    
    protected $fillable = [
        'user_id',
        'church_id',
        'appointment_id',
        'receipt_code',
        'payment_method',
        'amount_paid',
        'currency',
        'transaction_type',
        'refund_status',
        'refund_date',
        'refund_reason',
        'transaction_date',
        'notes',
    ];
    
    protected $casts = [
        'amount_paid' => 'decimal:2',
        'transaction_date' => 'datetime',
        'refund_date' => 'datetime',
    ];

    // Always ensure a receipt code is present on create
    protected static function booted()
    {
        static::creating(function (self $model) {
            if (empty($model->receipt_code)) {
                do {
                    $code = 'TXN' . str_pad(mt_rand(1, 99999999), 8, '0', STR_PAD_LEFT);
                } while (self::where('receipt_code', $code)->exists());
                $model->receipt_code = $code;
            }
        });
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    
    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class, 'church_id', 'ChurchID');
    }
    
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'AppointmentID');
    }
}
