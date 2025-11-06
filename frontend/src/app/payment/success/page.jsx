"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button.jsx';
import DataLoading from '@/components/DataLoading';
import axios from '@/lib/axios';

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionData, setTransactionData] = useState(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      const transactionId = searchParams.get('transaction_id');
      const sessionId = searchParams.get('session_id');
      const type = searchParams.get('type') || 'subscription'; // 'subscription' or 'appointment'
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(getErrorMessage(errorParam));
        setIsLoading(false);
        return;
      }

      if (!transactionId) {
        setError('Transaction information not found.');
        setIsLoading(false);
        return;
      }

      try {
        let apiUrl;
        
        if (type === 'appointment') {
          apiUrl = `/api/appointment-transactions/${transactionId}`;
        } else {
          const params = sessionId ? `?session_id=${sessionId}` : '';
          apiUrl = `/api/transactions/${transactionId}${params}`;
        }
        
        const response = await axios.get(apiUrl);
        
        if (response.data.success) {
          setTransactionData({ ...response.data.data, type });
        } else {
          setError(response.data.message || 'Failed to load transaction details.');
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        setError(error.response?.data?.message || 'Failed to load transaction details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [searchParams]);


  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'missing_session':
        return 'Payment session information is missing.';
      case 'session_not_found':
        return 'Payment session could not be found.';
      case 'verification_failed':
        return 'Payment verification failed. Please contact support.';
      case 'payment_failed':
        return 'Payment was not successful. Please try again.';
      default:
        return 'An error occurred processing your payment.';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center">
            <DataLoading message="Verifying your payment..." />
            <p className="mt-4 text-gray-600">
              Please wait while we confirm your payment.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This usually takes a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-semibold text-gray-900">Payment Error</h1>
              <p className="mt-2 text-gray-600">{error}</p>
              <div className="mt-6 space-y-3">
                <Link href="/plans">
                  <Button className="w-full">
                    Try Again
                  </Button>
                </Link>
                <Link href="/subscriptions">
                  <Button variant="outline" className="w-full">
                    View Subscriptions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-600 px-6 py-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Payment Successful!</h1>
            <p className="text-green-50 text-sm mt-1">
              {transactionData?.type === 'appointment'
                ? 'Your appointment payment has been processed successfully.'
                : 'Your subscription payment has been processed successfully.'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {transactionData && (
              <div className="space-y-5">
                {/* Reference Number Display */}
                {transactionData.receipt_code && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
                    <p className="text-xs text-gray-600 mb-2">Your Reference Number</p>
                    <p className="text-xl font-semibold text-blue-600 font-mono tracking-wide break-all mb-3">
                      {transactionData.receipt_code}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      A detailed receipt has been sent to your email by PayMongo.<br/>
                      Please save this reference number for your records and future reference.
                    </p>
                  </div>
                )}

                {/* Action Button */}
                {transactionData?.type === 'appointment' ? (
                  <Link href="/appointment" className="block">
                    <Button className="w-full">
                      View My Appointments
                    </Button>
                  </Link>
                ) : (
                  <Link href="/subscriptions" className="block">
                    <Button className="w-full">
                      View Subscription Status
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
          
          {/* Footer inside container */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-center">
            <p className="text-xs text-gray-500">Thank you for your payment!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <DataLoading message="Loading..." />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccess;
