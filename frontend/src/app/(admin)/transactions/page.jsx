"use client";

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Button from '@/components/Button';
import DataLoading from '@/components/DataLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import SearchAndPagination from '@/components/SearchAndPagination';
import { filterAndPaginateData } from '@/utils/tableUtils';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 6; // per your design

  // Define search fields
  const searchFields = ['receipt_code', 'user.name', 'user.email', 'new_plan.PlanName', 'newPlan.PlanName'];
  

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch a larger page size and paginate on the client using SearchAndPagination
      const response = await axios.get('/api/admin/transactions', { params: { per_page: 500, page: 1 } });
      
      if (response.data.success) {
        setTransactions(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Handle search query change and reset pagination
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };


  // Get filtered and paginated data
  const { data: paginatedTransactions, pagination } = filterAndPaginateData(
    transactions,
    searchQuery,
    searchFields,
    currentPage,
    itemsPerPage
  );

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const getPaymentStatus = (transaction) => {
    const status = transaction.payment_session?.status || 'unknown';
    
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
      cancelled: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Cancelled' },
      unknown: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Unknown' },
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };


  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Subscription Transactions</h1>

            <div className="overflow-x-auto">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Transaction Management</h3>
                  <p className="mt-1 text-sm text-gray-600">Manage and refund subscription payments</p>
                </div>
                
                <div className="px-6 py-4">
                  <SearchAndPagination
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.totalItems}
                    itemsPerPage={itemsPerPage}
                    placeholder="Search by reference, user, or plan..."
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200" aria-live="polite">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8">
                            <DataLoading message="Loading transactions..." />
                          </td>
                        </tr>
                      ) : paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map((transaction) => (
                          <tr key={transaction.SubTransactionID} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-mono font-medium text-gray-900">
                                {transaction.receipt_code || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {transaction.SubTransactionID}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600">
                                      {(transaction.user?.profile?.first_name || transaction.user?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {transaction.user?.profile?.first_name && transaction.user?.profile?.last_name
                                      ? `${transaction.user.profile.first_name} ${transaction.user.profile.last_name}`
                                      : transaction.user?.name || 'N/A'}
                                  </div>
                                  {transaction.user?.email && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {transaction.user.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.new_plan?.PlanName || transaction.newPlan?.PlanName || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              ₱{Number(transaction.AmountPaid).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(transaction.TransactionDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              {getPaymentStatus(transaction)}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() => handleViewDetails(transaction)}
                                className="text-sm px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Transaction Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Transaction Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reference:</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{selectedTransaction.receipt_code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-mono text-gray-900">{selectedTransaction.SubTransactionID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">₱{Number(selectedTransaction.AmountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedTransaction.TransactionDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Plan:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.new_plan?.PlanName || selectedTransaction.newPlan?.PlanName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">User Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm text-gray-900">
                      {selectedTransaction.user?.profile?.first_name && selectedTransaction.user?.profile?.last_name
                        ? `${selectedTransaction.user.profile.first_name} ${selectedTransaction.user.profile.last_name}`
                        : selectedTransaction.user?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User ID:</span>
                    <span className="text-sm font-mono text-gray-900">{selectedTransaction.user_id}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {selectedTransaction.payment_session && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTransaction.PaymentMethod || selectedTransaction.payment_session.payment_method || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Status:</span>
                      <span className="text-sm">{getPaymentStatus(selectedTransaction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Currency:</span>
                      <span className="text-sm text-gray-900">{selectedTransaction.payment_session.currency || 'PHP'}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Session ID:</span>
                      <span className="text-xs font-mono text-gray-900 break-all text-right max-w-xs">{selectedTransaction.payment_session.paymongo_session_id}</span>
                    </div>
                    {selectedTransaction.payment_session.checkout_url && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">Checkout URL:</span>
                        <a 
                          href={selectedTransaction.payment_session.checkout_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline break-all text-right max-w-xs"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {selectedTransaction.payment_session.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expires At:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedTransaction.payment_session.expires_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedTransaction.payment_session?.metadata && Object.keys(selectedTransaction.payment_session.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Metadata</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedTransaction.payment_session.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.Notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedTransaction.Notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
