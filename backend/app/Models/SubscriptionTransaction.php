<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionTransaction extends Model
{
    protected $table = 'SubscriptionTransaction';
    protected $primaryKey = 'SubTransactionID';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
