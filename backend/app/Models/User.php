<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    // Laravel default id is "id", so no need to change primaryKey

    protected $fillable = [
        'email',
        'password',
        'email_verified_at',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }

    /**
     * Get the user's profile.
     */
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }

    /**
     * Get the user's contact information.
     */
    public function contact()
    {
        return $this->hasOne(UserContact::class, 'user_id');
    }

    /**
     * Get the user's system role through their profile.
     */
    public function systemRole()
    {
        return $this->hasOneThrough(
            SystemRole::class,
            UserProfile::class,
            'user_id',
            'system_role_id',
            'id',
            'system_role_id'
        );
    }

    /**
     * Get all churches owned by the user through the ChurchOwner table.
     */
    public function churches()
    {
        return $this->hasManyThrough(
            Church::class,
            ChurchOwner::class,
            'UserID',
            'ChurchID',
            'id',
            'ChurchID'
        );
    }
}