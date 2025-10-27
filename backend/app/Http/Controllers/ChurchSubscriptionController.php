<?php

namespace App\Http\Controllers;

use App\Models\ChurchSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionTransaction;
use App\Models\PaymentSession;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

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
                'user_id' => $userId,
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

    /**
     * Create GCash payment session
     */
    public function createGCashPayment(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:SubscriptionPlan,PlanID'],
        ]);

        $userId = Auth::id();
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        // Check if user already has pending subscription
        $pendingExists = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Pending')
            ->exists();

        if ($pendingExists) {
            return response()->json(['error' => 'A pending subscription already exists'], 400);
        }

        // Check for existing pending payment session
        $existingSession = PaymentSession::where('user_id', $userId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingSession) {
            return response()->json([
                'success' => true,
                'checkout_url' => $existingSession->checkout_url,
                'session_id' => $existingSession->paymongo_session_id
            ]);
        }

        $paymongoService = new PayMongoService();
        
        $successUrl = url('/payment/success?session_id={CHECKOUT_SESSION_ID}');
        $cancelUrl = url('/payment/cancel?session_id={CHECKOUT_SESSION_ID}');
        
        $metadata = [
            'user_id' => $userId,
            'plan_id' => $plan->PlanID,
            'plan_name' => $plan->PlanName,
        ];

        $result = $paymongoService->createGCashCheckout(
            $plan->Price,
            "Subscription to {$plan->PlanName} Plan",
            $successUrl,
            $cancelUrl,
            $metadata
        );

        if (!$result['success']) {
            return response()->json([
                'error' => 'Failed to create payment session',
                'details' => $result['error']
            ], 500);
        }

        $checkoutData = $result['data'];

        // Determine expiration (PayMongo may not return expires_at)
        $expiresAtRaw = $checkoutData['attributes']['expires_at'] ?? null;
        $expiresAt = $expiresAtRaw ? Carbon::parse($expiresAtRaw) : now()->addMinutes(30);
        
        // Store payment session
        $paymentSession = PaymentSession::create([
            'user_id' => $userId,
            'plan_id' => $plan->PlanID,
            'paymongo_session_id' => $checkoutData['id'],
            'payment_method' => 'gcash',
            'amount' => $plan->Price,
            'currency' => 'PHP',
            'status' => 'pending',
            'checkout_url' => $checkoutData['attributes']['checkout_url'] ?? null,
            'metadata' => $metadata,
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'checkout_url' => $checkoutData['attributes']['checkout_url'],
            'session_id' => $checkoutData['id']
        ]);
    }

    /**
     * Create payment session for multiple payment methods
     */
    public function createPayment(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:SubscriptionPlan,PlanID'],
        ]);

        $userId = Auth::id();
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        // Check if user already has pending subscription
        $pendingExists = ChurchSubscription::where('UserID', $userId)
            ->where('Status', 'Pending')
            ->exists();

        if ($pendingExists) {
            return response()->json(['error' => 'A pending subscription already exists'], 400);
        }

        // Check for existing pending payment session
        $existingSession = PaymentSession::where('user_id', $userId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingSession) {
            return response()->json([
                'success' => true,
                'checkout_url' => $existingSession->checkout_url,
                'session_id' => $existingSession->paymongo_session_id
            ]);
        }

        $paymongoService = new PayMongoService();
        
        $successUrl = url('/payment/success?session_id={CHECKOUT_SESSION_ID}');
        $cancelUrl = url('/payment/cancel?session_id={CHECKOUT_SESSION_ID}');
        
        $metadata = [
            'user_id' => $userId,
            'plan_id' => $plan->PlanID,
            'plan_name' => $plan->PlanName,
        ];

        // Always create multi-payment checkout (GCash and Card only)
        $result = $paymongoService->createMultiPaymentCheckout(
            $plan->Price,
            "Subscription to {$plan->PlanName} Plan",
            $successUrl,
            $cancelUrl,
            $metadata
        );

        if (!$result['success']) {
            return response()->json([
                'error' => 'Failed to create payment session',
                'details' => $result['error']
            ], 500);
        }

        $checkoutData = $result['data'];

        // Determine expiration (PayMongo may not return expires_at)
        $expiresAtRaw = $checkoutData['attributes']['expires_at'] ?? null;
        $expiresAt = $expiresAtRaw ? Carbon::parse($expiresAtRaw) : now()->addMinutes(30);
        
        // Store payment session
        $paymentSession = PaymentSession::create([
            'user_id' => $userId,
            'plan_id' => $plan->PlanID,
            'paymongo_session_id' => $checkoutData['id'],
            'payment_method' => 'multi', // Multiple payment methods available
            'amount' => $plan->Price,
            'currency' => 'PHP',
            'status' => 'pending',
            'checkout_url' => $checkoutData['attributes']['checkout_url'] ?? null,
            'metadata' => $metadata,
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'checkout_url' => $checkoutData['attributes']['checkout_url'],
            'session_id' => $checkoutData['id']
        ]);
    }

    /**
     * Handle successful payment for both subscriptions and appointments
     */
    public function handlePaymentSuccess(Request $request)
    {
        $sessionId = $request->query('session_id');
        
        Log::info('Payment success handler called', [
            'session_id' => $sessionId,
            'full_url' => $request->fullUrl(),
            'all_params' => $request->all()
        ]);
        
        if (!$sessionId) {
            Log::warning('No session_id provided');
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/dashboard?error=missing_session');
        }

        // Handle case where PayMongo doesn't replace the placeholder
        if ($sessionId === '{CHECKOUT_SESSION_ID}') {
            Log::warning('PayMongo did not replace session_id placeholder, using latest session');
            
            // Find most recent pending PaymentSession (EXACTLY like subscriptions)
            $paymentSession = PaymentSession::where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->first();
                
            if (!$paymentSession) {
                $paymentSession = PaymentSession::where('status', 'paid')
                    ->where('updated_at', '>', now()->subMinutes(10))
                    ->orderBy('updated_at', 'desc')
                    ->first();
            }
            
            if ($paymentSession) {
                $metadata = $paymentSession->metadata ?? [];
                if (($metadata['type'] ?? null) === 'appointment_payment') {
                    return $this->activateAppointment($paymentSession);
                } else {
                    $transaction = $this->activateSubscription($paymentSession);
                    return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/payment/success?transaction_id=' . $transaction->SubTransactionID . '&session_id=' . $paymentSession->paymongo_session_id);
                }
            }
            
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/dashboard?success=payment_completed');
        }

        // First, get the session from PayMongo to check metadata type
        $paymongoService = new PayMongoService();
        $result = $paymongoService->getCheckoutSession($sessionId);
        
        if (!$result['success']) {
            Log::warning('PayMongo verification failed', ['session_id' => $sessionId]);
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/dashboard?error=payment_verification_failed');
        }

        $sessionData = $result['data'];
        $metadata = $sessionData['attributes']['metadata'] ?? [];
        $paymentType = $metadata['type'] ?? 'subscription'; // Default to subscription for backward compatibility
        
        Log::info('Payment type detected', ['type' => $paymentType, 'session_id' => $sessionId]);
        
        // Route to appropriate handler based on payment type
        if ($paymentType === 'appointment_payment') {
            return $this->handleAppointmentPayment($sessionId, $sessionData);
        } else {
            return $this->handleSubscriptionPayment($sessionId, $sessionData);
        }
    }
    
    /**
     * Handle appointment payment success
     */
    private function handleAppointmentPayment($sessionId, $sessionData)
    {
        $appointmentController = new \App\Http\Controllers\AppointmentController();
        return $appointmentController->processAppointmentPaymentSuccess($sessionId, $sessionData);
    }
    
    /**
     * Handle subscription payment success
     */
    private function handleSubscriptionPayment($sessionId, $sessionData)
    {
        // Find payment session
        $paymentSession = PaymentSession::where('paymongo_session_id', $sessionId)->first();
        
        if (!$paymentSession) {
            Log::error('Payment session not found for subscription', ['session_id' => $sessionId]);
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/subscriptions?error=session_not_found');
        }
        
        // If payment session is already processed, redirect to success immediately
        if ($paymentSession->status === 'paid') {
            $transaction = SubscriptionTransaction::where('user_id', $paymentSession->user_id)
                ->where('Notes', 'like', '%Session ID: ' . $paymentSession->paymongo_session_id . '%')
                ->orderBy('TransactionDate', 'desc')
                ->first();
                
            if ($transaction) {
                return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/payment/success?transaction_id=' . $transaction->SubTransactionID . '&session_id=' . $paymentSession->paymongo_session_id);
            }
        }

        $paymentStatus = $sessionData['attributes']['payment_intent']['attributes']['status'] ?? 'succeeded';
        
        Log::info('Subscription payment status', ['status' => $paymentStatus, 'session_id' => $sessionId]);
        
        $transaction = $this->activateSubscription($paymentSession);
        return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/payment/success?transaction_id=' . $transaction->SubTransactionID . '&session_id=' . $paymentSession->paymongo_session_id);
    }

    /**
     * Handle cancelled payment
     */
    public function handlePaymentCancel(Request $request)
    {
        $sessionId = $request->query('session_id');
        
        if ($sessionId) {
            PaymentSession::where('paymongo_session_id', $sessionId)
                ->update(['status' => 'cancelled']);
        }

        return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/subscriptions?info=payment_cancelled');
    }

    /**
     * Handle PayMongo webhook
     */
    public function handlePayMongoWebhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('paymongo-signature');
        
        $paymongoService = new PayMongoService();
        
        // Verify webhook signature
        if (!$paymongoService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Invalid PayMongo webhook signature');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $result = $paymongoService->processWebhook($payload);
        
        if (!$result['success']) {
            return response()->json(['error' => 'Invalid webhook data'], 400);
        }

        $eventType = $result['event_type'];
        $eventData = $result['data'];

        Log::info('PayMongo webhook received', [
            'event_type' => $eventType,
            'event_id' => $eventData['id'] ?? null
        ]);

        // Handle checkout session completed event
        if ($eventType === 'checkout_session.payment.paid') {
            $sessionId = $eventData['attributes']['checkout_session']['id'] ?? null;
            
            if ($sessionId) {
                $paymentSession = PaymentSession::where('paymongo_session_id', $sessionId)->first();
                
                if ($paymentSession && $paymentSession->isPending()) {
                    $this->activateSubscription($paymentSession);
                }
            }
        }

        return response()->json(['success' => true]);
    }
    
    /**
     * Activate appointment after successful payment (create ChurchTransaction)
     */
    private function activateAppointment(PaymentSession $paymentSession)
    {
        $metadata = $paymentSession->metadata ?? [];
        
        // Update payment session status  
        $paymentSession->update(['status' => 'paid']);
        
        // Create ChurchTransaction record
        $transaction = \App\Models\ChurchTransaction::create([
            'user_id' => $paymentSession->user_id,
            'church_id' => $metadata['church_id'] ?? 1,
            'appointment_id' => null,
            'paymongo_session_id' => $paymentSession->paymongo_session_id,
            'payment_method' => $paymentSession->payment_method === 'multi' ? 'gcash' : $paymentSession->payment_method,
            'amount_paid' => $paymentSession->amount,
            'currency' => 'PHP',
            'transaction_type' => 'appointment_payment',
            'transaction_date' => now(),
            'notes' => 'Appointment payment completed successfully',
            'metadata' => [
                'church_name' => $metadata['church_name'] ?? 'Church',
                'service_name' => $metadata['service_name'] ?? 'Service',
                'appointment_date' => $metadata['appointment_date'] ?? null,
                'payment_status' => 'completed'
            ]
        ]);
        
        Log::info('ChurchTransaction created from PaymentSession', [
            'transaction_id' => $transaction->ChurchTransactionID,
            'payment_session_id' => $paymentSession->id
        ]);
        
        return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/payment/success?transaction_id=' . $transaction->ChurchTransactionID . '&type=appointment&session_id=' . $paymentSession->paymongo_session_id);
    }

    /**
     * Activate subscription after successful payment
     */
    private function activateSubscription(PaymentSession $paymentSession)
    {
        DB::beginTransaction();
        
        try {
            $userId = $paymentSession->user_id;
            $plan = $paymentSession->plan;
            
            // Get actual payment method from PayMongo session
            $actualPaymentMethod = $this->getActualPaymentMethod($paymentSession->paymongo_session_id);
            
            // Update payment session status and actual payment method
            $paymentSession->update([
                'status' => 'paid',
                'payment_method' => $actualPaymentMethod
            ]);
            
            // Check for existing active subscription
            $activeSubscription = ChurchSubscription::where('UserID', $userId)
                ->where('Status', 'Active')
                ->first();
            
            // Determine subscription status and dates
            $hasActiveSubscription = $activeSubscription !== null;
            $subscriptionStatus = $hasActiveSubscription ? 'Pending' : 'Active';
            $startDate = $hasActiveSubscription 
                ? Carbon::parse($activeSubscription->EndDate)
                : now();
            
            $duration = max(1, $plan->DurationInMonths);
            $endDate = $startDate->copy()->addMonths($duration);
            
            // Create new subscription
            $churchSubscription = ChurchSubscription::create([
                'UserID' => $userId,
                'PlanID' => $plan->PlanID,
                'StartDate' => $startDate,
                'EndDate' => $endDate,
                'Status' => $subscriptionStatus,
            ]);
            
            // Create transaction record
            $transaction = SubscriptionTransaction::create([
                'user_id' => $userId,
                'OldPlanID' => $activeSubscription?->PlanID,
                'NewPlanID' => $plan->PlanID,
                'PaymentMethod' => $actualPaymentMethod,
                'AmountPaid' => $plan->Price,
                'TransactionDate' => now(),
                'Notes' => $hasActiveSubscription 
                    ? $actualPaymentMethod . ' payment via PayMongo - Pending start on ' . $startDate->toDateString() . ' - Session ID: ' . $paymentSession->paymongo_session_id
                    : $actualPaymentMethod . ' payment via PayMongo - Session ID: ' . $paymentSession->paymongo_session_id,
            ]);
            
            // Don't deactivate old subscription if new one is pending
            // The old subscription will remain active until the new one starts
            
            DB::commit();
            
            Log::info('Subscription created successfully', [
                'user_id' => $userId,
                'subscription_id' => $churchSubscription->SubscriptionID,
                'status' => $subscriptionStatus,
                'start_date' => $startDate->toDateString(),
                'has_active_subscription' => $hasActiveSubscription,
                'payment_session_id' => $paymentSession->id
            ]);
            
            return $transaction;
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to activate subscription', [
                'error' => $e->getMessage(),
                'payment_session_id' => $paymentSession->id,
                'user_id' => $paymentSession->user_id
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Get actual payment method from PayMongo session
     */
    private function getActualPaymentMethod($sessionId)
    {
        try {
            $paymongoService = new PayMongoService();
            $result = $paymongoService->getCheckoutSession($sessionId);
            
            if ($result['success']) {
                $sessionData = $result['data'];
                $paymentIntent = $sessionData['attributes']['payment_intent'] ?? null;
                
                if ($paymentIntent) {
                    $payments = $paymentIntent['attributes']['payments'] ?? [];
                    
                    if (!empty($payments)) {
                        $payment = $payments[0];
                        $paymentType = $payment['attributes']['source']['type'] ?? null;
                        
                        // Map PayMongo payment types to our system
                        $paymentMethodMap = [
                            'gcash' => 'GCash',
                            'card' => 'Card',
                            'grab_pay' => 'GrabPay',
                            'paymaya' => 'PayMaya',
                        ];
                        
                        return $paymentMethodMap[$paymentType] ?? ucfirst($paymentType);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Could not retrieve actual payment method', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
        }
        
        // Fallback to default
        return 'Online Payment';
    }

    /**
     * Get transaction details
     */
    public function getTransactionDetails(Request $request, $transactionId)
    {
        try {
            $transaction = SubscriptionTransaction::with(['newPlan', 'user'])
                ->where('SubTransactionID', $transactionId)
                ->where('user_id', Auth::id())
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            // Find the related payment session
            $sessionId = $request->query('session_id');
            $paymentSession = null;
            
            if ($sessionId) {
                $paymentSession = PaymentSession::where('paymongo_session_id', $sessionId)
                    ->where('user_id', Auth::id())
                    ->first();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction' => $transaction,
                    'payment_session' => $paymentSession,
                    'receipt_number' => (string) $transaction->SubTransactionID,
                    'formatted_date' => $transaction->TransactionDate->format('F j, Y g:i A'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transaction details', [
                'error' => $e->getMessage(),
                'transaction_id' => $transactionId,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction details'
            ], 500);
        }
    }

    /**
     * Download receipt PDF
     */
    public function downloadReceipt(Request $request, $transactionId)
    {
        try {
            $transaction = SubscriptionTransaction::with(['newPlan', 'user'])
                ->where('SubTransactionID', $transactionId)
                ->where('user_id', Auth::id())
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            $sessionId = $request->query('session_id');
            $paymentSession = null;
            
            if ($sessionId) {
                $paymentSession = PaymentSession::where('paymongo_session_id', $sessionId)
                    ->where('user_id', Auth::id())
                    ->first();
            }

            $receiptNumber = (string) $transaction->SubTransactionID;
            $paymentMethod = $transaction->PaymentMethod === 'multi' ? 'GCash' : $transaction->PaymentMethod;

            $data = [
                'brand' => 'FaithSeeker',
                'receiptNumber' => $receiptNumber,
                'formattedDate' => $transaction->TransactionDate->format('F j, Y g:i A'),
                'transaction' => $transaction,
                'plan' => $transaction->newPlan,
                'amount' => $transaction->AmountPaid,
                'paymentMethod' => $paymentMethod,
                'duration' => $transaction->newPlan->DurationInMonths ?? null,
                'user' => $transaction->user,
                'session' => $paymentSession,
            ];

            $pdf = Pdf::loadView('receipts.subscription', $data)->setPaper('a4');
            return $pdf->download('receipt-' . $receiptNumber . '.pdf');
        } catch (\Exception $e) {
            Log::error('Failed to generate receipt', [
                'error' => $e->getMessage(),
                'transaction_id' => $transactionId,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate receipt'
            ], 500);
        }
    }

    /**
     * Generate receipt content
     */
    private function generateReceiptContent($transaction, $paymentSession, $receiptNumber)
    {
        $content = "\n";
        $content .= "================================================\n";
        $content .= "           CHURCH BOOKING SYSTEM               \n";
        $content .= "              PAYMENT RECEIPT                  \n";
        $content .= "================================================\n\n";
        
        $content .= "Transaction ID: {$receiptNumber}\n";
        $content .= "Transaction Date: " . $transaction->TransactionDate->format('F j, Y g:i A') . "\n";
        $content .= "Customer: " . $transaction->user->name . "\n";
        $content .= "Email: " . $transaction->user->email . "\n\n";
        
        $content .= "------------------------------------------------\n";
        $content .= "PURCHASE DETAILS\n";
        $content .= "------------------------------------------------\n";
        $content .= "Plan: " . ($transaction->newPlan->PlanName ?? 'N/A') . "\n";
        $content .= "Duration: " . ($transaction->newPlan->DurationInMonths ?? 'N/A') . " month(s)\n";
        $content .= "Payment Method: " . $transaction->PaymentMethod . "\n";
        
        if ($paymentSession) {
            $content .= "Payment Session ID: " . $paymentSession->paymongo_session_id . "\n";
        }
        
        $content .= "\n------------------------------------------------\n";
        $content .= "PAYMENT SUMMARY\n";
        $content .= "------------------------------------------------\n";
        $content .= "Amount Paid: ₱" . number_format($transaction->AmountPaid, 2) . "\n";
        $content .= "Payment Status: PAID\n";
        
        $content .= "\n------------------------------------------------\n";
        $content .= "NOTES\n";
        $content .= "------------------------------------------------\n";
        $content .= $transaction->Notes . "\n";
        
        $content .= "\n================================================\n";
        $content .= "     Thank you for your subscription!          \n";
        $content .= "================================================\n";
        
        return $content;
    }

}
