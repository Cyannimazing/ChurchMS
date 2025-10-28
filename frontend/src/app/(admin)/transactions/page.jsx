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
  const itemsPerPage = 6; // per your design

  // Define search fields
  const searchFields = ['receipt_code', 'user.name', 'user.email', 'new_plan.PlanName', 'newPlan.PlanName'];
  

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      await axios.get('/sanctum/csrf-cookie');
      
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

  const getSubscriptionStatus = (transaction) => {
    if (transaction.Notes?.includes('REFUNDED')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Refunded</span>;
    }
    if (transaction.Notes?.includes('Pending start')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
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
                  Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200" aria-live="polite">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8">
                            <DataLoading message="Loading transactions..." />
                          </td>
                        </tr>
                      ) : paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
                              {getSubscriptionStatus(transaction)}
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

    </div>
  );
};

export default TransactionsPage;
