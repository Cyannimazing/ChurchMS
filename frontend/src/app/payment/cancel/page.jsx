"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button.jsx';

const PaymentCancel = () => {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Payment Cancelled</h1>
            <p className="mt-2 text-gray-600">
              Your GCash payment was cancelled. No charges have been made to your account.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              You can try again anytime or choose a different payment method.
            </p>
            
            <div className="mt-6 space-y-3">
              <Link href="/plans">
                <Button className="w-full">
                  Choose Plan Again
                </Button>
              </Link>
              <Link href="/subscriptions">
                <Button variant="outline" className="w-full">
                  View Current Subscriptions
                </Button>
              </Link>
            </div>
            
            {sessionId && (
              <p className="mt-4 text-xs text-gray-400">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;