"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button.jsx';

const PaymentCancelContent = () => {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Cancel Header */}
          <div className="bg-red-600 px-6 py-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Payment Cancelled</h1>
            <p className="text-red-50 text-sm mt-1">Your payment was cancelled. No charges have been made.</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-5">
              <p className="text-sm text-gray-600 text-center">You can try again anytime or choose a different payment method.</p>

              <div className="space-y-3">
                <Link href="/plans" className="block">
                  <Button className="w-full">Try Again</Button>
                </Link>
                <Link href="/subscriptions" className="block">
                  <Button variant="outline" className="w-full">View Current Subscriptions</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer inside container */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-center">
            {sessionId ? (
              <p className="text-xs text-gray-400">Session: {sessionId.substring(0, 24)}...</p>
            ) : (
              <p className="text-xs text-gray-500">Need help? Contact support.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
};

export default PaymentCancel;
