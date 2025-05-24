<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionTransaction extends Model
{
    protected $table = 'SubscriptionTransaction';
    protected $primaryKey = 'SubTransactionID';
    public $timestamps = false;

    protected $fillable = [
        'OldPlanID',
        'NewPlanID',
        'TransactionType',
        'PaymentMethod',
        'AmountPaid',
        'TransactionDate',
        'Notes',
    ];

    public function oldPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'OldPlanID', 'PlanID');
    }

    public function newPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'NewPlanID', 'PlanID');
    }
}