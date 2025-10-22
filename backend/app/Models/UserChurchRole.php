<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserChurchRole extends Model
{
    protected $table = 'UserChurchRole';
    protected $primaryKey = 'UserChurchRoleID';
    protected $fillable = ['user_id', 'ChurchID', 'RoleID'];
    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function church()
    {
        return $this->belongsTo(Church::class, 'ChurchID', 'ChurchID');
    }

    public function role()
    {
        return $this->belongsTo(ChurchRole::class, 'RoleID', 'RoleID');
    }
}