<?php

namespace App\Console\Commands;

use App\Models\ChurchSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateSubscriptionsCommand extends Command
{
    protected $signature = 'subscriptions:update';
    protected $description = 'Update subscription statuses: mark expired and activate pending';

    public function handle()
    {
        Log::info('Running subscriptions:update at ' . now());

        // Mark active subscriptions as expired
        $expiredCount = ChurchSubscription::where('Status', 'Active')
            ->where('EndDate', '<=', now())
            ->update(['Status' => 'Expired']);
        Log::info("Marked $expiredCount subscriptions as Expired");

        // Activate pending subscriptions
        $pendingSubscriptions = ChurchSubscription::where('Status', 'Pending')
            ->where('StartDate', '<=', now())
            ->get();

        $activatedCount = 0;
        foreach ($pendingSubscriptions as $subscription) {
            // Ensure no other active subscription exists
            ChurchSubscription::where('UserID', $subscription->UserID)
                ->where('Status', 'Active')
                ->update(['Status' => 'Expired']);

            $subscription->update(['Status' => 'Active']);
            Log::info("Activated subscription ID {$subscription->SubscriptionID} for user ID {$subscription->UserID}, Plan ID {$subscription->PlanID}");
            $activatedCount++;
        }

        Log::info("Activated $activatedCount pending subscriptions");
        $this->info('Subscription statuses updated successfully.');
    }
}