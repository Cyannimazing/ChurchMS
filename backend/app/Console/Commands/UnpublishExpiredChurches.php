<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChurchSubscription;
use App\Models\Church;

class UnpublishExpiredChurches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'churches:unpublish-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Unpublish churches that do not have active subscriptions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to unpublish churches without active subscriptions...');

        // Find all users who have active subscriptions
        $userIdsWithActiveSubscription = ChurchSubscription::where('Status', 'Active')
            ->where('EndDate', '>', now())
            ->pluck('UserID')
            ->unique();

        // Find all users who own churches
        $allChurchOwnerIds = Church::pluck('user_id')->unique();

        // Find users who own churches but don't have active subscriptions
        $userIdsWithoutActiveSubscription = $allChurchOwnerIds->diff($userIdsWithActiveSubscription);

        if ($userIdsWithoutActiveSubscription->isEmpty()) {
            $this->info('No churches need to be unpublished.');
            return 0;
        }

        // Unpublish all churches owned by users without active subscriptions
        $unpublishedCount = Church::whereIn('user_id', $userIdsWithoutActiveSubscription)
            ->where('IsPublic', true)
            ->update(['IsPublic' => false]);

        $this->info("Successfully unpublished {$unpublishedCount} churches due to inactive subscriptions.");
        
        // Log the affected users for debugging
        $this->info("Affected users: " . $userIdsWithoutActiveSubscription->implode(', '));

        return 0;
    }
}
