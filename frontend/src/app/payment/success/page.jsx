"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button.jsx';
import DataLoading from '@/components/DataLoading';
import axios from '@/lib/axios';

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        await axios.get('/sanctum/csrf-cookie');
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

  const handleDownloadReceipt = async () => {
    const transactionId = transactionData?.receipt_number || transactionData?.transaction?.SubTransactionID || transactionData?.transaction?.ChurchTransactionID;
    if (!transactionId) {
      alert('Transaction ID not found');
      return;
    }
    
    setIsDownloading(true);
    try {
      await axios.get('/sanctum/csrf-cookie');
      
      let apiUrl;
      let filename;
      
      if (transactionData?.type === 'appointment') {
        apiUrl = `/api/appointment-transactions/${transactionId}/receipt`;
        filename = `appointment-receipt-${transactionId}.pdf`;
      } else {
        const sessionId = searchParams.get('session_id');
        const params = sessionId ? `?session_id=${sessionId}` : '';
        apiUrl = `/api/transactions/${transactionId}/receipt${params}`;
        filename = `receipt-${transactionId}.pdf`;
      }
      
      const response = await axios.get(apiUrl, {
        responseType: 'blob'
      });
      
      // Force download as PDF regardless of response type
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
    <div className="lg:p-6 w-full h-screen pt-20 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">
                {transactionData?.type === 'appointment' 
                  ? 'Your appointment payment has been processed successfully.'
                  : 'Your subscription payment has been processed successfully.'
                }
              </p>
            </div>
          </div>

          <div className="p-6">
            {transactionData && (
              <div className="max-w-md mx-auto">
                <div id="receipt-card" className="rounded-lg p-8 mb-6" style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}>
                  {/* Receipt Header */}
                  <div className="text-center mb-6" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                    {transactionData?.type !== 'appointment' && (
                      <h1 className="text-xl font-bold" style={{ color: '#111827' }}>FAITHSEEKER</h1>
                    )}
                    <h2 className="text-lg font-semibold mt-2" style={{ color: '#374151' }}>Payment Receipt</h2>
                    <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Generated on {new Date().toLocaleString()}</p>
                  </div>
                  
                  <dl className="space-y-3">
                    <div className="flex justify-between py-1">
                      <dt className="text-sm" style={{ color: '#6b7280' }}>Transaction ID:</dt>
                      <dd className="text-sm font-medium" style={{ color: '#111827' }}>{transactionData.receipt_number}</dd>
                    </div>
                    
                    {transactionData?.type === 'appointment' && (
                      <div className="flex justify-between py-1">
                        <dt className="text-sm" style={{ color: '#6b7280' }}>Receipt Code:</dt>
                        <dd className="text-sm font-medium font-mono" style={{ color: '#111827' }}>
                          {transactionData.receipt_code || transactionData.transaction?.receipt_code || 'N/A'}
                        </dd>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-1">
                      <dt className="text-sm" style={{ color: '#6b7280' }}>Date:</dt>
                      <dd className="text-sm font-medium" style={{ color: '#111827' }}>{transactionData.formatted_date}</dd>
                    </div>
                    
                    {transactionData?.type === 'appointment' ? (
                      <>
                        <div className="flex justify-between py-1">
                          <dt className="text-sm" style={{ color: '#6b7280' }}>Church:</dt>
                          <dd className="text-sm font-medium" style={{ color: '#111827' }}>
                            {transactionData.church_name || 'N/A'}
                          </dd>
                        </div>
                        
                        <div className="flex justify-between py-1">
                          <dt className="text-sm" style={{ color: '#6b7280' }}>Service:</dt>
                          <dd className="text-sm font-medium" style={{ color: '#111827' }}>
                            {transactionData.service_name || 'N/A'}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-1">
                          <dt className="text-sm" style={{ color: '#6b7280' }}>Plan:</dt>
                          <dd className="text-sm font-medium" style={{ color: '#111827' }}>
                            {transactionData.transaction?.new_plan?.PlanName || transactionData.transaction?.newPlan?.PlanName || 'N/A'}
                          </dd>
                        </div>
                        
                        <div className="flex justify-between py-1">
                          <dt className="text-sm" style={{ color: '#6b7280' }}>Duration:</dt>
                          <dd className="text-sm font-medium" style={{ color: '#111827' }}>
                            {transactionData.transaction?.new_plan?.DurationInMonths || transactionData.transaction?.newPlan?.DurationInMonths || 0} month(s)
                          </dd>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between py-1">
                      <dt className="text-sm" style={{ color: '#6b7280' }}>Payment Method:</dt>
                      <dd className="text-sm font-medium capitalize" style={{ color: '#111827' }}>
                        {transactionData?.type === 'appointment' 
                          ? transactionData.payment_method_display || 'N/A'
                          : (transactionData.transaction?.PaymentMethod === 'multi' ? 'GCash' : transactionData.transaction?.PaymentMethod) || 'N/A'
                        }
                      </dd>
                    </div>
                    
                    <div className="pt-3 mt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                      <div className="flex justify-between">
                        <dt className="text-base font-semibold" style={{ color: '#111827' }}>Amount Paid:</dt>
                        <dd className="text-base font-bold amount-green" style={{ color: '#16a34a' }}>
                          ₱{Number(
                            transactionData?.type === 'appointment' 
                              ? transactionData.transaction?.amount_paid || 0
                              : transactionData.transaction?.AmountPaid || 0
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </dd>
                      </div>
                    </div>
                  </dl>
                  
                  {/* Receipt Footer */}
                  <div className="text-center mt-6 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <p className="text-sm" style={{ color: '#4b5563' }}>
                      {transactionData?.type === 'appointment' 
                        ? 'Thank you for your appointment!'
                        : 'Thank you for your subscription!'
                      }
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Keep this receipt for your records.</p>
                    {transactionData?.type === 'appointment' && (transactionData.receipt_code || transactionData.transaction?.receipt_code) && (
                      <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>
                        Important: Save your Receipt Code for refunds if needed.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={handleDownloadReceipt}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading Receipt...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Receipt
                      </>
                    )}
                  </Button>
                  
                  {transactionData?.type === 'appointment' ? (
                    <Link href="/appointment" className="w-full">
                      <Button variant="outline" className="w-full">
                        View My Appointments
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/subscriptions" className="w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        View Subscription Status
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;