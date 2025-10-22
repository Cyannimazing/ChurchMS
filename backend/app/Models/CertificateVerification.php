<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CertificateVerification extends Model
{
    use HasFactory;

    protected $primaryKey = 'VerificationID';
    
    protected $fillable = [
        'AppointmentID',
        'ChurchID',
        'CertificateType',
        'VerificationToken',
        'CertificateData',
        'RecipientName',
        'CertificateDate',
        'IssuedBy',
        'IsActive'
    ];

    protected $casts = [
        'CertificateData' => 'array',
        'CertificateDate' => 'date',
        'IsActive' => 'boolean'
    ];

    /**
     * Generate a unique verification token
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('VerificationToken', $token)->exists());
        
        return $token;
    }

    /**
     * Get the appointment associated with this verification
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'AppointmentID', 'AppointmentID');
    }

    /**
     * Get the church associated with this verification
     */
    public function church()
    {
        return $this->belongsTo(Church::class, 'ChurchID', 'ChurchID');
    }

    /**
     * Get verification URL
     */
    public function getVerificationUrl(): string
    {
        return url("/verify-certificate/{$this->VerificationToken}");
    }

    /**
     * Check if verification is still valid
     */
    public function isValid(): bool
    {
        return $this->IsActive && $this->church && $this->church->ChurchStatus === 'Active';
    }
}