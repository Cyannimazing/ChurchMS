<?php

namespace App\Http\Controllers;

use App\Models\ChurchSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChurchSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $activeSubscription = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Active')
            ->with('plan')
            ->first();
        $pendingSubscription = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Pending')
            ->with('plan')
            ->first();

        $response = [
            'active' => $activeSubscription,
            'pending' => $pendingSubscription,
        ];

        
        return response()->json($response);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:SubscriptionPlan,PlanID'],
            'payment_method' => ['required', 'string', 'max:50'],
        ]);

        $userId = Auth::id();
        $newPlan = SubscriptionPlan::findOrFail($validated['plan_id']);

        $pendingExists = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Pending')
            ->exists();

        if ($pendingExists) {
            return response()->json(['error' => 'A pending subscription already exists'], 400);
        }

        $activeSubscription = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Active')
            ->first();

        $startDate = $activeSubscription 
            ? \Carbon\Carbon::parse($activeSubscription->EndDate)
            : now();

        $duration = max(1, $newPlan->DurationInMonths);
        $endDate = $startDate->copy()->addMonths($duration);

        DB::beginTransaction();

        try {
            $churchSubscription = ChurchSubscription::create([
                'UserID' => $userId,
                'PlanID' => $validated['plan_id'],
                'StartDate' => $startDate,
                'EndDate' => $endDate,
                'Status' => 'Pending',
            ]);

            SubscriptionTransaction::create([
                'OldPlanID' => $activeSubscription?->PlanID,
                'NewPlanID' => $validated['plan_id'],
                'PaymentMethod' => $validated['payment_method'],
                'AmountPaid' => $newPlan->Price,
                'TransactionDate' => now(),
                'Notes' => 'Subscription change queued to start on ' . $startDate->toDateString(),
            ]);

            DB::commit();

            $churchSubscription->load('plan');

            return response()->json($churchSubscription, 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'An unexpected error occurred', 'message' => $e->getMessage()], 500);
        }
    }

    public function cancelPending(Request $request)
    {
        $userId = Auth::id();
        $pendingSubscription = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Pending')
            ->first();

        if (!$pendingSubscription) {
            return response()->json(['error' => 'No pending subscription found'], 404);
        }

        $pendingSubscription->delete();
        return response()->noContent();
    }
}