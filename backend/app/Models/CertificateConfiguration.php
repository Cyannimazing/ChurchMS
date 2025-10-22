<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateConfiguration extends Model
{
    protected $table = 'certificate_configurations';
    protected $primaryKey = 'CertificateConfigID';
    
    protected $fillable = [
        'ChurchID',
        'CertificateType',
        'SacramentServiceID',
        'field_mappings',
        'form_data',
    ];
    
    protected $casts = [
        'ChurchID' => 'integer',
        'field_mappings' => 'array',
        'form_data' => 'array',
    ];
    
    /**
     * Get the church that owns this certificate configuration.
     */
    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class, 'ChurchID', 'ChurchID');
    }
}