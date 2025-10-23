<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SacramentService extends Model
{
    protected $table = 'sacrament_service';
    protected $primaryKey = 'ServiceID';
    
    protected $fillable = [
        'ChurchID',
        'ServiceName',
        'Description',
        'isStaffForm',
        'isDownloadableContent',
        'advanceBookingNumber',
        'advanceBookingUnit',
        'member_discount_type',
        'member_discount_value',
        'isCertificateGeneration',
    ];
    
    protected $casts = [
        'ChurchID' => 'integer',
        'isStaffForm' => 'boolean',
        'isDownloadableContent' => 'boolean',
        'advanceBookingNumber' => 'integer',
        'member_discount_value' => 'decimal:2',
        'isCertificateGeneration' => 'boolean',
    ];
    
    /**
     * Get the church that owns this sacrament service.
     */
    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class, 'ChurchID', 'ChurchID');
    }
    
    /**
     * Get all input fields for this service.
     */
    public function inputFields(): HasMany
    {
        return $this->hasMany(ServiceInputField::class, 'ServiceID', 'ServiceID')
                    ->orderBy('SortOrder');
    }
    
    /**
     * Get all requirements for this service.
     */
    public function requirements(): HasMany
    {
        return $this->hasMany(ServiceRequirement::class, 'ServiceID', 'ServiceID')
                    ->orderBy('SortOrder');
    }
    
    /**
     * Get only mandatory requirements for this service.
     */
    public function mandatoryRequirements(): HasMany
    {
        return $this->requirements()->where('IsMandatory', true);
    }
    
    /**
     * Get only optional requirements for this service.
     */
    public function optionalRequirements(): HasMany
    {
        return $this->requirements()->where('IsMandatory', false);
    }
    
    /**
     * Get only required input fields for this service.
     */
    public function requiredInputFields(): HasMany
    {
        return $this->inputFields()->where('IsRequired', true);
    }
    
    /**
     * Get all sub-services for this service.
     */
    public function subServices(): HasMany
    {
        return $this->hasMany(SubService::class, 'ServiceID', 'ServiceID');
    }
}
