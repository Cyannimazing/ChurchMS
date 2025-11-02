"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { DollarSign, Calendar, Eye, Receipt, Users, Search, X, RefreshCw, Settings, Percent } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { Button } from "@/components/Button.jsx";
import Alert from "@/components/Alert.jsx";
import Input from "@/components/Input.jsx";
import Label from "@/components/Label.jsx";

const TransactionRecordPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Filter states
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Transaction details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundData, setRefundData] = useState({
    refund_reason: null,
    apply_convenience_fee: false
  });
  const [refundAlert, setRefundAlert] = useState({ show: false, type: '', message: '' });
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  
  // Convenience fee state
  const [convenienceFee, setConvenienceFee] = useState(null);
  const [showConvenienceFeeModal, setShowConvenienceFeeModal] = useState(false);
  const [convenienceFeeForm, setConvenienceFeeForm] = useState({
    fee_name: 'Convenience Fee',
    fee_type: 'percent',
    fee_value: 0,
    is_active: true
  });
  const [convenienceFeeLoading, setConvenienceFeeLoading] = useState(false);
  const [convenienceFeeAlert, setConvenienceFeeAlert] = useState({ show: false, type: '', message: '' });

  // Permission helper functions
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };
  
  const hasAccess = hasPermission("transaction_list");
  const canSetupFee = hasPermission("transaction_setupFee");
  const canEditFee = hasPermission("transaction_editFee");
  const canViewTransaction = hasPermission("transaction_view");
  const canRefundTransaction = hasPermission("transaction_refund");

  // Fetch convenience fee
  const fetchConvenienceFee = async () => {
    try {
      const sanitizedChurchName = churchname.replace(/:\d+$/, "");
      const response = await axios.get(`/api/convenience-fees/${sanitizedChurchName}`);
      
      if (response.data.success && response.data.convenience_fee) {
        setConvenienceFee(response.data.convenience_fee);
        setConvenienceFeeForm({
          fee_name: response.data.convenience_fee.fee_name,
          fee_type: response.data.convenience_fee.fee_type,
          fee_value: response.data.convenience_fee.fee_value,
          is_active: response.data.convenience_fee.is_active
        });
      } else {
        setConvenienceFee(null);
      }
    } catch (err) {
      console.error('Error fetching convenience fee:', err);
      setConvenienceFee(null);
    }
  };

  // Fetch church transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean up church name for API call
      const sanitizedChurchName = churchname.replace(/:\d+$/, "");
      
      // Fetch church transactions
      const response = await axios.get(`/api/church-transactions/${sanitizedChurchName}`);
      setTransactions(response.data.transactions);
      setFilteredTransactions(response.data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load transactions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess && churchname) {
      fetchTransactions();
      fetchConvenienceFee();
    }
  }, [hasAccess, churchname]);
  
  // Extract unique services and dates from transactions
  useEffect(() => {
    if (transactions.length > 0) {
      // Extract unique services (exclude refunded)
      const services = transactions
        .filter(t => t.refund_status !== 'refunded' && t.appointment?.service?.ServiceName)
        .map(t => t.appointment.service.ServiceName)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      setAvailableServices(services);
    }
  }, [transactions]);
  
  // Update available dates when service is selected
  useEffect(() => {
    if (selectedService && transactions.length > 0) {
      // Extract dates for the selected service
      const dates = transactions
        .filter(t => 
          t.refund_status !== 'refunded' && 
          t.appointment?.service?.ServiceName === selectedService &&
          t.transaction_date
        )
        .map(t => {
          const date = new Date(t.transaction_date);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)
      setAvailableDates(dates);
    } else {
      setAvailableDates([]);
      setSelectedDate('');
    }
  }, [selectedService, transactions]);

  // Filter transactions based on search term, service, and date
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply service filter
    if (selectedService) {
      filtered = filtered.filter(transaction => 
        transaction.appointment?.service?.ServiceName === selectedService
      );
    }
    
    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(transaction => {
        if (!transaction.transaction_date) return false;
        const transactionDate = new Date(transaction.transaction_date).toISOString().split('T')[0];
        return transactionDate === selectedDate;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => (
        transaction.appointment?.service?.ServiceName?.toLowerCase().includes(searchLower) ||
        transaction.user?.profile?.first_name?.toLowerCase().includes(searchLower) ||
        transaction.user?.profile?.last_name?.toLowerCase().includes(searchLower) ||
        transaction.user?.email?.toLowerCase().includes(searchLower) ||
        transaction.ChurchTransactionID?.toString().includes(searchLower) ||
        transaction.receipt_code?.toLowerCase().includes(searchLower) ||
        transaction.paymongo_session_id?.toLowerCase().includes(searchLower)
      ));
    }
    
    // Sort by transaction_date descending (newest first)
    filtered.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedService, selectedDate, transactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewTransaction = async (transaction) => {
    try {
      // Fetch detailed transaction data from API
      const response = await axios.get(`/api/appointment-transactions/${transaction.ChurchTransactionID}`);
      if (response.data.success) {
        setSelectedTransaction(response.data.data);
        setShowDetailsModal(true);
      } else {
        setAlert({
          show: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to load transaction details.'
        });
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setAlert({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load transaction details.'
      });
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
  };

  const handleRefundTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    // Auto-determine convenience fee checkbox based on cancellation category
    // Green (no_fee) = no convenience fee deduction (unchecked)
    // Red (with_fee) = apply convenience fee deduction (checked if configured)
    const isRedCategory = transaction.appointment?.cancellation_category === 'with_fee';
    const shouldApplyFee = isRedCategory && convenienceFee && convenienceFee.is_active;
    
    setRefundData({
      refund_reason: null,
      apply_convenience_fee: shouldApplyFee
    });
    setShowRefundModal(true);
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setSelectedTransaction(null);
    setRefundData({
      refund_reason: null,
      apply_convenience_fee: false
    });
    setRefundAlert({ show: false, type: '', message: '' });
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransaction) return;
    
    // Clear previous alerts
    setRefundAlert({ show: false, type: '', message: '' });
    
    setRefundLoading(true);
    try {
      const response = await axios.put(`/api/church-transactions/${selectedTransaction.ChurchTransactionID}/refund`, {
        refund_reason: refundData.refund_reason,
        apply_convenience_fee: refundData.apply_convenience_fee
      });
      
      // Check if the response indicates success
      if (response.data.success === true) {
        // Update the transaction in state
        const updatedTransactions = transactions.map(t => 
          t.ChurchTransactionID === selectedTransaction.ChurchTransactionID 
            ? { ...t, refund_status: 'refunded', refund_date: new Date().toISOString() }
            : t
        );
        setTransactions(updatedTransactions);
        setFilteredTransactions(updatedTransactions);
        
        handleCloseRefundModal();
        setAlert({
          show: true,
          type: 'success',
          title: 'Refund Processed',
          message: 'Transaction has been marked as refunded successfully.'
        });
      } else {
        // Backend returned success: false
        const errorMessage = response.data.message || 'Failed to process refund.';
        setRefundAlert({
          show: true,
          type: 'error',
          message: errorMessage
        });
      }
      
    } catch (err) {
      let errorMessage = 'Failed to process refund. Please try again.';
      
      // Handle different error scenarios
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid receipt code or request.';
        } else if (err.response.status === 404) {
          errorMessage = 'Transaction not found.';
        } else {
          errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Show alert in modal
      setRefundAlert({
        show: true,
        type: 'error',
        message: errorMessage
      });
      
    } finally {
      setRefundLoading(false);
    }
  };

  const canRefund = (transaction) => {
    return transaction.appointment && 
           ['Cancelled', 'Rejected'].includes(transaction.appointment.Status) &&
           transaction.refund_status !== 'refunded';
  };

  const getReceiptCode = (transaction) => {
    return transaction.receipt_code || 'N/A';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Unknown User';
    if (user.profile?.first_name && user.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user.email || 'Unknown User';
  };

  // Convenience fee handlers
  const handleConvenienceFeeModalOpen = () => {
    setShowConvenienceFeeModal(true);
    setConvenienceFeeAlert({ show: false, type: '', message: '' });
  };

  const handleConvenienceFeeModalClose = () => {
    setShowConvenienceFeeModal(false);
    setConvenienceFeeAlert({ show: false, type: '', message: '' });
  };

  const handleConvenienceFeeSubmit = async (e) => {
    e.preventDefault();
    setConvenienceFeeLoading(true);
    setConvenienceFeeAlert({ show: false, type: '', message: '' });

    try {
      const sanitizedChurchName = churchname.replace(/:\d+$/, "");
      const response = await axios.post(`/api/convenience-fees/${sanitizedChurchName}`, convenienceFeeForm);
      
      if (response.data.success) {
        setConvenienceFee(response.data.convenience_fee);
        setConvenienceFeeAlert({
          show: true,
          type: 'success',
          message: 'Convenience fee saved successfully!'
        });
        
        setTimeout(() => {
          handleConvenienceFeeModalClose();
        }, 1500);
      } else {
        setConvenienceFeeAlert({
          show: true,
          type: 'error',
          message: response.data.message || 'Failed to save convenience fee.'
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save convenience fee.';
      setConvenienceFeeAlert({
        show: true,
        type: 'error',
        message: errorMessage
      });
    } finally {
      setConvenienceFeeLoading(false);
    }
  };

  const calculateRefundAmount = (originalAmount, applyFee = true) => {
    if (!applyFee || !convenienceFee || !convenienceFee.is_active) return originalAmount;
    
    let feeAmount = 0;
    if (convenienceFee.fee_type === 'percent') {
      feeAmount = (originalAmount * convenienceFee.fee_value) / 100;
    } else {
      feeAmount = convenienceFee.fee_value;
    }
    
    return originalAmount - feeAmount;
  };

  const calculateConvenienceFee = (originalAmount) => {
    if (!convenienceFee || !convenienceFee.is_active) return 0;
    
    if (convenienceFee.fee_type === 'percent') {
      return (originalAmount * convenienceFee.fee_value) / 100;
    } else {
      return convenienceFee.fee_value;
    }
  };

  // Calculate totals (exclude refunded transactions, apply filters)
  const totalIncome = filteredTransactions
    .filter(t => t.refund_status !== 'refunded')
    .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);
  
  // Clear all filters
  const handleClearFilters = () => {
    setSelectedService('');
    setSelectedDate('');
    setSearchTerm('');
  };

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Transaction Record page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full h-full">
        {/* Alert */}
        {alert.show && (
          <div className="mb-4">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert({ show: false, type: '', title: '', message: '' })}
            />
          </div>
        )}
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Church Transaction Record
            </h1>
            
            <div className="mt-4">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Appointment Payment Records</h3>
                        <p className="text-xs text-gray-600">View all transactions from appointment payments.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {convenienceFee && convenienceFee.is_active && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <div className="text-sm">
                              <span className="font-medium text-blue-900">{convenienceFee.fee_name}: </span>
                              <span className="text-blue-700">
                                {convenienceFee.fee_type === 'percent' ? 
                                  `${convenienceFee.fee_value}%` : 
                                  formatCurrency(convenienceFee.fee_value)
                                }
                              </span>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={handleConvenienceFeeModalOpen}
                          variant="outline"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 border border-blue-300 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={convenienceFee ? !canEditFee : !canSetupFee}
                          title={
                            convenienceFee 
                              ? (!canEditFee ? 'You do not have permission to edit convenience fee' : '')
                              : (!canSetupFee ? 'You do not have permission to setup convenience fee' : '')
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {convenienceFee ? 'Edit Fee' : 'Setup Fee'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {/* Filters */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                          {(selectedService || selectedDate || searchTerm) && (
                            <Button
                              onClick={handleClearFilters}
                              variant="outline"
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 border-gray-300"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear Filters
                            </Button>
                          )}
                        </div>
                        {/* Total Amount Display */}
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                          <div className="text-xs text-green-600 font-medium">Collections</div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-green-700">{formatCurrency(totalIncome)}</span>
                            <span className="text-xs text-green-600">({filteredTransactions.filter(t => t.refund_status !== 'refunded').length})</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Filter */}
                        <div>
                          <Label htmlFor="service-filter" className="text-sm font-medium text-gray-700 mb-1">
                            Service
                          </Label>
                          <select
                            id="service-filter"
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                          >
                            <option value="">All Services</option>
                            {availableServices.map((service) => (
                              <option key={service} value={service}>
                                {service}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Date Filter */}
                        <div>
                          <Label htmlFor="date-filter" className="text-sm font-medium text-gray-700 mb-1">
                            Transaction Date
                          </Label>
                          <select
                            id="date-filter"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            disabled={!selectedService && availableDates.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">All Dates</option>
                            {selectedService && availableDates.length > 0 ? (
                              availableDates.map((date) => (
                                <option key={date} value={date}>
                                  {new Date(date + 'T00:00:00').toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </option>
                              ))
                            ) : (
                              !selectedService && (
                                <option value="" disabled>Select a service first</option>
                              )
                            )}
                          </select>
                          {selectedService && availableDates.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No dates available for this service</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Active Filters Display */}
                      {(selectedService || selectedDate) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedService && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Service: {selectedService}
                              <button
                                onClick={() => setSelectedService('')}
                                className="ml-1.5 hover:text-blue-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          {selectedDate && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Date: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                              <button
                                onClick={() => setSelectedDate('')}
                                className="ml-1.5 hover:text-purple-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Search and Pagination */}
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredTransactions.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search transactions..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8">
                              <DataLoading message="Loading transactions..." />
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                              {error}
                            </td>
                          </tr>
                        ) : currentTransactions.length > 0 ? (
                          currentTransactions.map((transaction) => (
                            <tr key={transaction.ChurchTransactionID} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
<div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Receipt className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {transaction.receipt_code || `#${transaction.ChurchTransactionID}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {transaction.payment_method === 'card' ? 'Card' : 'GCash'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
<div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {getUserDisplayName(transaction.user)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {transaction.user?.email || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.appointment?.service?.ServiceName || 'N/A'}
                                </div>
                                {transaction.appointment?.AppointmentDate && (
                                  <div className="text-sm text-gray-500">
                                    {new Date(transaction.appointment.AppointmentDate).toLocaleDateString('en-PH')}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${
                                  transaction.refund_status === 'refunded' ? 'text-red-600 line-through' : 'text-gray-900'
                                }`}>
                                  {formatCurrency(transaction.amount_paid)}
                                </div>
                                {transaction.refund_status === 'refunded' && transaction.metadata?.refund_calculation && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Refunded: {formatCurrency(transaction.metadata.refund_calculation.refund_amount)}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {transaction.refund_status === 'refunded' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Refunded
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Paid
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <div>
                                    <div className="font-medium">
                                      {formatTime(transaction.transaction_date)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleViewTransaction(transaction)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!canViewTransaction}
                                    title={!canViewTransaction ? 'You do not have permission to view transaction details' : ''}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => canRefund(transaction) && handleRefundTransaction(transaction)}
                                    variant="outline"
                                    disabled={!canRefund(transaction) || !canRefundTransaction}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:hover:bg-red-50 border-red-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={
                                      !canRefundTransaction ? 'You do not have permission to process refunds' :
                                      !canRefund(transaction) ? 'This transaction cannot be refunded' : ''
                                    }
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Refund
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Receipt className="h-12 w-12 text-gray-300 mb-2" />
                                <p>No transactions found.</p>
                              </div>
                            </td>
                          </tr>
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

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Transaction Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Transaction Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reference:</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{selectedTransaction.receipt_code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-mono text-gray-900">{selectedTransaction.id || selectedTransaction.ChurchTransactionID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedTransaction.amount_paid || selectedTransaction.transaction?.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.formatted_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Service:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.service?.name || 'N/A'}</span>
                  </div>
                  {selectedTransaction.service?.variant && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Variant:</span>
                      <span className="text-sm text-gray-900">{selectedTransaction.service.variant}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.user?.name || getUserDisplayName(selectedTransaction.transaction?.user)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.user?.email || selectedTransaction.transaction?.user?.email || 'N/A'}</span>
                  </div>
                  {selectedTransaction.user?.phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900">{selectedTransaction.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Church Information */}
              {selectedTransaction.church && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Church Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Church Name:</span>
                      <span className="text-sm text-gray-900">{selectedTransaction.church.name}</span>
                    </div>
                    {selectedTransaction.church.address && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">Address:</span>
                        <span className="text-sm text-gray-900 text-right max-w-xs">{selectedTransaction.church.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              {selectedTransaction.appointment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Appointment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedTransaction.appointment.date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm text-gray-900">{selectedTransaction.appointment.date}</span>
                      </div>
                    )}
                    {selectedTransaction.appointment.time && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="text-sm text-gray-900">{selectedTransaction.appointment.time}</span>
                      </div>
                    )}
                    {selectedTransaction.appointment.status && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedTransaction.appointment.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          selectedTransaction.appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedTransaction.appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTransaction.appointment.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Payment Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedTransaction.payment_method_display || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedTransaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTransaction.status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Currency:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.currency || 'PHP'}</span>
                  </div>
                  {selectedTransaction.paymongo_session_id && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Session ID:</span>
                      <span className="text-xs font-mono text-gray-900 break-all text-right max-w-xs">{selectedTransaction.paymongo_session_id}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Metadata */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Metadata</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Refund Information */}
              {selectedTransaction.refund_status === 'refunded' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Refund Information</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-red-600">Refund Status</label>
                        <p className="text-red-800 font-semibold">Refunded</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-red-600">Amount Refunded</label>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTransaction.metadata?.refund_calculation?.refund_amount 
                            ? formatCurrency(selectedTransaction.metadata.refund_calculation.refund_amount)
                            : formatCurrency(selectedTransaction.amount_paid) // Fallback to original amount
                          }
                        </p>
                        {!selectedTransaction.metadata?.refund_calculation && (
                          <p className="text-xs text-gray-500 italic">
                            (Full amount - no fee calculation available)
                          </p>
                        )}
                      </div>
                      
                      {selectedTransaction.refund_date && (
                        <div>
                          <label className="text-sm font-medium text-red-600">Refund Date</label>
                          <p className="text-red-800">{formatTime(selectedTransaction.refund_date)}</p>
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-red-600">Refund Calculation</label>
                        <div className="mt-2 bg-white rounded-lg p-3 border">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Original Amount:</span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(selectedTransaction.metadata?.refund_calculation?.original_amount || selectedTransaction.amount_paid)}
                              </span>
                            </div>
                            
                            {selectedTransaction.metadata?.refund_calculation?.convenience_fee_applied && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Convenience Fee Deducted:</span>
                                <span className="text-red-600 font-medium">
                                  -{formatCurrency(selectedTransaction.metadata.refund_calculation.convenience_fee_amount)}
                                </span>
                              </div>
                            )}
                            
                            {!selectedTransaction.metadata?.refund_calculation?.convenience_fee_applied && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Convenience Fee:</span>
                                <span className="text-gray-500 italic">Not applied</span>
                              </div>
                            )}
                            
                            <div className="border-t pt-2 flex justify-between font-semibold">
                              <span className="text-gray-900">Refund Amount:</span>
                              <span className="text-green-600">
                                {formatCurrency(
                                  selectedTransaction.metadata?.refund_calculation?.refund_amount || selectedTransaction.amount_paid
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <Button
                onClick={handleCloseDetailsModal}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl mx-auto relative w-full max-w-md">
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 rounded-t-lg border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Process Refund
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Transaction #{selectedTransaction.ChurchTransactionID}
                </p>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleRefundSubmit} className="px-6 py-6 space-y-4">
              {/* Refund Alert */}
              {refundAlert.show && (
                <div className="mb-4">
                  <Alert
                    type={refundAlert.type}
                    title={refundAlert.type === 'error' ? 'Error' : 'Success'}
                    message={refundAlert.message}
                    onClose={() => setRefundAlert({ show: false, type: '', message: '' })}
                  />
                </div>
              )}
              
              <div className="space-y-4">

                {/* Cancellation Info */}
                {selectedTransaction.appointment && selectedTransaction.appointment.cancellation_category && (
                  <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Cancellation Information</h4>
                    
                    {/* Cancellation badge */}
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700">Category:</span>
                      <div className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        selectedTransaction.appointment.cancellation_category === 'no_fee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedTransaction.appointment.cancellation_category === 'no_fee' ? 'No Fee (Green)' : 'With Fee (Red)'}
                      </div>
                    </div>

                    {/* Cancellation note */}
                    {selectedTransaction.appointment.cancellation_note && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Note:</span>
                        <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200">{selectedTransaction.appointment.cancellation_note}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Refund calculation display */}
                {selectedTransaction && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Refund Calculation</h4>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Base Amount:</span>
                        <span className="font-medium text-blue-900">{formatCurrency(selectedTransaction.amount_paid)}</span>
                      </div>
                      {convenienceFee && convenienceFee.is_active && refundData.apply_convenience_fee && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">{convenienceFee.fee_name}:</span>
                          <span className="text-red-600">-{formatCurrency(calculateConvenienceFee(selectedTransaction.amount_paid))}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-200 pt-1 flex justify-between font-semibold">
                        <span className="text-blue-900">Refund Amount:</span>
                        <span className={`${refundData.apply_convenience_fee && convenienceFee && convenienceFee.is_active ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(calculateRefundAmount(selectedTransaction.amount_paid, refundData.apply_convenience_fee))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply convenience fee checkbox */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="apply_convenience_fee"
                      checked={refundData.apply_convenience_fee}
                      onChange={(e) => setRefundData({...refundData, apply_convenience_fee: e.target.checked})}
                      disabled={!convenienceFee || !convenienceFee.is_active}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="apply_convenience_fee" className={`ml-2 text-sm font-medium ${
                      convenienceFee && convenienceFee.is_active ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      Apply convenience fee deduction
                    </Label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {convenienceFee && convenienceFee.is_active ? (
                      <>
                        Fee: {convenienceFee.fee_type === 'percent' ? `${convenienceFee.fee_value}%` : formatCurrency(convenienceFee.fee_value)} - 
                        This will be deducted from the refund amount.
                      </>
                    ) : (
                      'No active convenience fee configured.'
                    )}
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={handleCloseRefundModal}
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={refundLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {refundLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Process Refund
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convenience Fee Modal */}
      {showConvenienceFeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl mx-auto relative w-full max-w-md">
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 rounded-t-lg border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {convenienceFee ? 'Edit Convenience Fee' : 'Setup Convenience Fee'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Configure fee deductions for refund calculations
                </p>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleConvenienceFeeSubmit} className="px-6 py-6 space-y-4">
              {/* Convenience Fee Alert */}
              {convenienceFeeAlert.show && (
                <div className="mb-4">
                  <Alert
                    type={convenienceFeeAlert.type}
                    title={convenienceFeeAlert.type === 'error' ? 'Error' : 'Success'}
                    message={convenienceFeeAlert.message}
                    onClose={() => setConvenienceFeeAlert({ show: false, type: '', message: '' })}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Name
                  </Label>
                  <Input
                    type="text"
                    value={convenienceFeeForm.fee_name}
                    onChange={(e) => setConvenienceFeeForm({...convenienceFeeForm, fee_name: e.target.value})}
                    placeholder="Enter fee name"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    required
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Type
                  </Label>
                  <select
                    value={convenienceFeeForm.fee_type}
                    onChange={(e) => setConvenienceFeeForm({...convenienceFeeForm, fee_type: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (PHP)</option>
                  </select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Value
                  </Label>
                  <Input
                    type="number"
                    step={convenienceFeeForm.fee_type === 'percent' ? '0.01' : '0.01'}
                    min="0"
                    max={convenienceFeeForm.fee_type === 'percent' ? '100' : undefined}
                    value={convenienceFeeForm.fee_value}
                    onChange={(e) => setConvenienceFeeForm({...convenienceFeeForm, fee_value: parseFloat(e.target.value) || 0})}
                    placeholder={convenienceFeeForm.fee_type === 'percent' ? 'Enter percentage (e.g., 2.5 for 2.5%)' : 'Enter amount (e.g., 100 for PHP100)'}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {convenienceFeeForm.fee_type === 'percent' 
                      ? 'Enter the percentage fee (e.g., 2.5 for 2.5%)' 
                      : 'Enter the fixed fee amount in PHP (e.g., 100 for PHP100)'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={convenienceFeeForm.is_active}
                      onChange={(e) => setConvenienceFeeForm({...convenienceFeeForm, is_active: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                      Active (deduct from refunds)
                    </Label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Check this box to automatically deduct this fee from refund calculations.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={handleConvenienceFeeModalClose}
                  variant="outline"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={convenienceFeeLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {convenienceFeeLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Fee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionRecordPage;
