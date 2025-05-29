<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserContact;
use App\Models\SubscriptionPlan;
use App\Models\ChurchSubscription;
use App\Models\Church;
use App\Models\ChurchRole;
use App\Models\UserChurchRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Insert system roles
        DB::table('system_roles')->insertOrIgnore([
            ['role_name' => 'Regular'],
            ['role_name' => 'ChurchOwner'],
            ['role_name' => 'ChurchStaff'],
            ['role_name' => 'Admin'],
        ]);

        // Subscription plans
        SubscriptionPlan::firstOrCreate([
            'PlanName' => 'Basic Plan',
        ], [
            'Price' => 29.99,
            'DurationInMonths' => 1,
            'MaxChurchesAllowed' => 1,
            'Description' => 'Basic plan for church owners',
        ]);

        SubscriptionPlan::firstOrCreate([
            'PlanName' => 'Premium Plan',
        ], [
            'Price' => 49.99,
            'DurationInMonths' => 1,
            'MaxChurchesAllowed' => 3,
            'Description' => 'Premium plan for church owners',
        ]);

        // Get role IDs for system_roles table
        $roles = DB::table('system_roles')->pluck('id', 'role_name');

        // Create Admin user
        $admin = User::firstOrCreate(['email' => 'admin@example.com'], [
            'password' => Hash::make('123123123'),
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ]);
        UserProfile::firstOrCreate(['user_id' => $admin->id], [
            'first_name' => 'Admin',
            'last_name' => 'User',
            'system_role_id' => $roles['Admin'] ?? null,
        ]);

        // Create Regular user
        $regular = User::firstOrCreate(['email' => 'regular@example.com'], [
            'password' => Hash::make('123123123'),
            'email_verified_at' => now(),
        ]);
        UserProfile::firstOrCreate(['user_id' => $regular->id], [
            'first_name' => 'Regular',
            'last_name' => 'User',
            'system_role_id' => $roles['Regular'] ?? null,
        ]);

        // Create ChurchOwner user with subscription
        $owner = User::firstOrCreate(['email' => 'owner@example.com'], [
            'password' => Hash::make('123123123'),
            'email_verified_at' => now(),
        ]);
        UserProfile::firstOrCreate(['user_id' => $owner->id], [
            'first_name' => 'Owner',
            'last_name' => 'User',
            'system_role_id' => $roles['ChurchOwner'] ?? null,
        ]);
        $plan = SubscriptionPlan::first();
        ChurchSubscription::firstOrCreate([
            'UserID' => $owner->id,
            'PlanID' => $plan->PlanID,
        ], [
            'StartDate' => now(),
            'EndDate' => now()->addMonths(1),
            'Status' => 'Active',
        ]);

        // Create Church for ChurchOwner
        $church = Church::firstOrCreate([
            'ChurchName' => 'Sample Church',
            'user_id' => $owner->id,
        ], [
            'IsPublic' => false,
            'Latitude' => 14.5995,
            'Longitude' => 120.9842,
            'ChurchStatus' => Church::STATUS_ACTIVE,
        ]);

        // Create ChurchRole for that church to avoid FK errors
        $churchRole = ChurchRole::firstOrCreate([
            'ChurchID' => $church->ChurchID,
            'RoleName' => 'Staff',
        ]);

        // Create ChurchStaff user linked to the church
        $staff = User::firstOrCreate(['email' => 'staff@example.com'], [
            'password' => Hash::make('123123123'),
            'email_verified_at' => now(),
        ]);
        UserProfile::firstOrCreate(['user_id' => $staff->id], [
            'first_name' => 'Staff',
            'last_name' => 'User',
            'system_role_id' => $roles['ChurchStaff'] ?? null,
        ]);
        UserContact::firstOrCreate(['user_id' => $staff->id], [
            'address' => 'Staff Address',
            'contact_number' => '09181234567',
        ]);

        // Now link staff user to the church with that church role
        UserChurchRole::firstOrCreate([
            'user_id' => $staff->id,
            'ChurchID' => $church->ChurchID,
            'RoleID' => $churchRole->RoleID,
        ]);

        // Seed permissions
        $permissions = ['appointment_list', 'employee_list', 'role_list', 'sacrament_list', 'schedule_list'];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['PermissionName' => $perm]);
        }
    }
}
