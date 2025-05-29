<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserContact;
use App\Models\SubscriptionPlan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Insert system roles
        DB::table('system_roles')->insert([
            ['role_name' => 'Regular'],
            ['role_name' => 'ChurchOwner'],
            ['role_name' => 'ChurchStaff'],
            ['role_name' => 'Admin'],
        ]);

        // Create subscription plans
        SubscriptionPlan::create([
            'PlanName' => 'Basic Plan',
            'Price' => 29.99,
            'DurationInMonths' => 1,
            'MaxChurchesAllowed' => 1,
            'Description' => 'Test plan for church owners',
        ]);

        SubscriptionPlan::create([
            'PlanName' => 'Premium Plan',
            'Price' => 49.99,
            'DurationInMonths' => 1,
            'MaxChurchesAllowed' => 3,
            'Description' => 'Test plan for church owners',
        ]);

        // Create Admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'password' => Hash::make('adminpassword'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]
        );

        // Retrieve the 'Admin' role ID
        $adminRoleId = DB::table('system_roles')->where('role_name', 'Admin')->value('id');

        // Create UserProfile linking to Admin role
        UserProfile::firstOrCreate(
            ['user_id' => $adminUser->id],
            [
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => 'User',
                'system_role_id' => $adminRoleId,
            ]
        );

        // Create UserContact for the Admin user
        UserContact::firstOrCreate(
            ['user_id' => $adminUser->id],
            [
                'address' => '123 Admin Street',
                'contact_number' => '09171234567',
            ]
        );

        // Seed permissions
        $permissions = [
            'appointment_list',
            'employee_list',
            'role_list',
            'sacrament_list',
            'schedule_list',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['PermissionName' => $permission]);
        }

    }
}
