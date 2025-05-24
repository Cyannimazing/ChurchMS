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
            'subscription_plan_id' => [
                'required_if:role_id,2',
                'nullable',
                'exists:SubscriptionPlan,PlanID',
            ],
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

        if ($request->role_id == 2) {
            $plan = SubscriptionPlan::findOrFail($request->subscription_plan_id);
            $startDate = now();
            $endDate = now()->addMinutes(3);

            ChurchSubscription::create([
                'UserID' => $user->id,
                'PlanID' => $request->subscription_plan_id,
                'StartDate' => $startDate,
                'EndDate' => $endDate,
                'Status' => 'Active',
            ]);

            SubscriptionTransaction::create([
                'NewPlanID' => $request->subscription_plan_id,
                'PaymentMethod' => $request->payment_method ?? 'Unknown',
                'AmountPaid' => $plan->Price,
                'TransactionDate' => now(),
                'Notes' => 'Initial subscription for ChurchOwner registration',
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}