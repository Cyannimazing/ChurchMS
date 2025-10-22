<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserContact;
use App\Models\ChurchSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionTransaction;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['required', 'in:1,2'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:1'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'system_role_id' => $request->role_id,
        ]);

        UserContact::create([
            'user_id' => $user->id,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
        ]);

        // Auto-assign Free Plan for Church Owners
        if ($request->role_id == 2) {
            // Get the Free Plan
            $freePlan = SubscriptionPlan::where('PlanName', 'Free Plan')->first();
            
            if (!$freePlan) {
                // Fallback: create free plan if it doesn't exist
                $freePlan = SubscriptionPlan::create([
                    'PlanName' => 'Free Plan',
                    'Price' => 0.00,
                    'DurationInMonths' => 1,
                    'MaxChurchesAllowed' => 1,
                    'Description' => 'Free trial plan for new church owners - 1 month access with basic features',
                ]);
            }
            
            $startDate = now();
            $endDate = now()->addMonths($freePlan->DurationInMonths); // 1 month from now

            // Create church subscription with Free Plan
            ChurchSubscription::create([
                'UserID' => $user->id,
                'PlanID' => $freePlan->PlanID,
                'StartDate' => $startDate,
                'EndDate' => $endDate,
                'Status' => 'Active',
            ]);

            // Create transaction record for the free plan
            SubscriptionTransaction::create([
                'user_id' => $user->id,
                'NewPlanID' => $freePlan->PlanID,
                'PaymentMethod' => 'Free Trial',
                'AmountPaid' => 0.00,
                'TransactionDate' => now(),
                'Notes' => 'Free trial subscription automatically assigned during ChurchOwner registration',
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}