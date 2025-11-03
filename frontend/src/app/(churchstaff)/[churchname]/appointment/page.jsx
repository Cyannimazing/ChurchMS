"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import axios from "@/lib/axios";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Calendar, Clock, MapPin, Users, Eye, Check, X, AlertTriangle, Search, FileText, User, Mail, Phone, MapPin as Location, FileText as CertificateIcon, Download } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { Button } from "@/components/Button.jsx";
import FormRenderer from "@/components/FormRenderer.jsx";
import CertificateGenerator from "@/components/CertificateGenerator.jsx";
import CertificateTypeModal from "@/components/CertificateTypeModal.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import Alert from "@/components/Alert";

// Warning Block Component
const WarningBlock = ({ type, title, description, count, onShow, onClear, isActive }) => {
  const typeStyles = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      clearButton: 'bg-red-100 hover:bg-red-200 text-red-800'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200', 
      icon: 'text-amber-500',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      clearButton: 'bg-amber-100 hover:bg-amber-200 text-amber-800'
    }
  };

  const styles = typeStyles[type] || typeStyles.warning;

  return (
    <div className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          <div className="mt-3 flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-900">
              {count} appointment{count !== 1 ? 's' : ''}
            </span>
            {count > 0 && (
              <>
                <Button
                  onClick={onShow}
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded ${styles.button}`}
                >
                  Show All
                </Button>
                {isActive && (
                  <Button
                    onClick={onClear}
                    variant="outline"
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded ${styles.clearButton}`}
                  >
                    Clear
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const searchParams = useSearchParams();
  
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [activeServiceTab, setActiveServiceTab] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // Warning quick-filters: 'none' | 'expired_pending' | 'due_approved'
  const [warningFilter, setWarningFilter] = useState('none');
  // Focused appointment from notifications
  const [focusAppointmentId, setFocusAppointmentId] = useState(null);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Form data state for staff input
  const [staffFormData, setStaffFormData] = useState({});
  
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [cancellationData, setCancellationData] = useState({
    category: 'no_fee', // 'no_fee' (green) or 'with_fee' (red)
    note: ''
  });
  
  // Certificate generation state
  const [showCertificateTypeModal, setShowCertificateTypeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState('marriage');
  
  // Alert state
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  
  // Approval state
  const [canApproveAppointment, setCanApproveAppointment] = useState(true);
  
  // Auto-complete state
  const [showAutoCompleteModal, setShowAutoCompleteModal] = useState(false);
  const [autoCompleteService, setAutoCompleteService] = useState('All');
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  
  // Mass Report state
  const [showMassReportModal, setShowMassReportModal] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [reportTime, setReportTime] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  

  // Check if user is ChurchOwner or has appointment_list permission
  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "appointment_list"
    );
  
  // Permission helper functions
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };
  
  const canReviewAppointment = hasPermission("appointment_review");
  const canSaveFormData = hasPermission("appointment_saveFormData");
  const canAcceptApplication = hasPermission("appointment_acceptApplication");
  const canRejectApplication = hasPermission("appointment_rejectApplication");
  const canMarkCompleted = hasPermission("appointment_markCompleted");
  const canGenerateCertificate = hasPermission("appointment_generateCertificate");
  const canGenerateMassReport = hasPermission("appointment_generateMassReport");


  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean up church name for API call
      const sanitizedChurchName = churchname.replace(/:\d+$/, "");
      
      // Fetch appointments for this church using church name
      const response = await axios.get(`/api/church-appointments/${sanitizedChurchName}`);
      setAppointments(response.data.appointments);
      setFilteredAppointments(response.data.appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load appointments';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess && churchname) {
      fetchAppointments();
    }
  }, [hasAccess, churchname]);

  // Read appointmentId from URL and set focus (do not open modal)
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (appointmentId) {
      setFocusAppointmentId(parseInt(appointmentId));
      // Remove the query parameter from URL after capturing it
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // When focus is set and appointments are loaded, switch to its service tab and loosen filters
  useEffect(() => {
    if (focusAppointmentId && appointments.length > 0) {
      const apt = appointments.find(a => a.AppointmentID === focusAppointmentId);
      if (apt) {
        setActiveServiceTab(apt.ServiceName || 'All');
        setStatusFilter('All');
        setYearFilter('All');
        setWarningFilter('none');
        setSearchTerm('');
        setCurrentPage(1);
      }
    }
  }, [focusAppointmentId, appointments]);


  // Update approval eligibility when appointment details change
  useEffect(() => {
    if (appointmentDetails?.formConfiguration) {
      const canApprove = checkAllRequiredSubmissionsComplete(appointmentDetails.formConfiguration);
      setCanApproveAppointment(canApprove);
    } else {
      setCanApproveAppointment(true); // No requirements means can approve
    }
  }, [appointmentDetails]);

  // Get unique services for filter dropdown
  const uniqueServices = [...new Set(appointments.map(apt => apt.ServiceName))].filter(Boolean).sort();
  
  // Get unique years from appointments
  const uniqueYears = [...new Set(appointments.map(apt => {
    const appointmentDate = new Date(apt.AppointmentDate);
    return appointmentDate.getFullYear();
  }))].sort((a, b) => b - a); // Sort years in descending order (newest first)

  // Filter appointments based on search term, status, active service tab, year, and warning quick-filters
  useEffect(() => {
    let filtered = [...appointments];

    // If focused from notification, show only that appointment
    if (focusAppointmentId) {
      filtered = filtered.filter(appointment => appointment.AppointmentID === focusAppointmentId);
    }

    // Apply active service tab filter (skipped if focused already narrowed to one)
    if (!focusAppointmentId && activeServiceTab !== "All") {
      filtered = filtered.filter(appointment => appointment.ServiceName === activeServiceTab);
    }

    // Apply status filter
    if (!focusAppointmentId && statusFilter !== "All") {
      filtered = filtered.filter(appointment => appointment.Status === statusFilter);
    }
    
    // Apply year filter
    if (!focusAppointmentId && yearFilter !== "All") {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.AppointmentDate);
        return appointmentDate.getFullYear().toString() === yearFilter;
      });
    }

    // Apply warning quick-filters
    if (!focusAppointmentId) {
      if (warningFilter === 'expired_pending') {
        filtered = filtered.filter(a => isAppointmentExpired(a.created_at, a.Status));
      } else if (warningFilter === 'due_approved') {
        filtered = filtered.filter(a => isAppointmentDueOrOverdue(a));
      }
    }

    // Apply search filter
    if (!focusAppointmentId && searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => (
        appointment.ServiceName?.toLowerCase().includes(searchLower) ||
        appointment.UserName?.toLowerCase().includes(searchLower) ||
        appointment.UserEmail?.toLowerCase().includes(searchLower)
      ));
    }

    // Sort by creation date descending (newest first - recently added on top)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeServiceTab, yearFilter, warningFilter, appointments, focusAppointmentId]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status, createdAt) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    // Check if appointment is older than 72 hours for pending status
    const isExpired = status === 'Pending' && createdAt && 
      new Date() - new Date(createdAt) > 72 * 60 * 60 * 1000;
    
    switch (status) {
      case 'Pending':
        return (
          <span className={`${baseClasses} ${isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {isExpired ? 'Pending (72h+)' : 'Pending'}
          </span>
        );
      case 'Approved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <Check className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <X className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      case 'Completed':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Check className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  // Helper function to check if appointment is expired (72+ hours old)
  const isAppointmentExpired = (createdAt, status) => {
    if (status !== 'Pending') return false;
    if (!createdAt) return false;
    
    // Parse date properly (handle 'YYYY-MM-DD HH:mm:ss' format)
    const created = new Date(createdAt.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now - created;
    const hoursElapsed = diffMs / (1000 * 60 * 60);
    const isExpired = hoursElapsed >= 72;
    
    return isExpired;
  };

  // Helper: check if an Approved appointment is due today or overdue
  const isAppointmentDueOrOverdue = (appointment) => {
    if (appointment?.Status !== 'Approved' || !appointment?.AppointmentDate) return false;
    const apptDate = new Date(appointment.AppointmentDate);
    const today = new Date();
    // Normalize to start of day for date-only comparison
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfAppt = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());

    if (startOfAppt < startOfToday) return true; // past days are overdue
    if (startOfAppt.getTime() === startOfToday.getTime()) return true; // due today
    return false;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Function to check if all required submissions are complete
  const checkAllRequiredSubmissionsComplete = (formConfiguration) => {
    if (!formConfiguration) return true; // No form config means no requirements
    
    // Check main requirements
    if (formConfiguration.requirements) {
      for (const req of formConfiguration.requirements) {
        if (req.needed && !req.isSubmitted) {
          return false; // Found a needed requirement that is not submitted
        }
      }
    }
    
    // Check sub-service requirements
    if (formConfiguration.sub_services) {
      for (const subService of formConfiguration.sub_services) {
        if (subService.requirements) {
          for (const req of subService.requirements) {
            if (req.needed && !req.isSubmitted) {
              return false; // Found a needed sub-service requirement that is not submitted
            }
          }
        }
      }
    }
    
    return true; // All required submissions are complete
  };

  // Handle submission status changes from FormRenderer
  const handleSubmissionStatusChange = (itemId, isSubmitted, type) => {
    if (!appointmentDetails?.formConfiguration) return;
    
    // Update the form configuration with new submission status
    const updatedFormConfig = { ...appointmentDetails.formConfiguration };
    
    if (type === 'requirement') {
      // Update main requirement
      updatedFormConfig.requirements = updatedFormConfig.requirements?.map(req => 
        req.id === itemId ? { ...req, isSubmitted } : req
      );
    } else if (type === 'sub_service_requirement') {
      // Update sub-service requirement
      updatedFormConfig.sub_services = updatedFormConfig.sub_services?.map(subService => ({
        ...subService,
        requirements: subService.requirements?.map(req => 
          req.id === itemId ? { ...req, isSubmitted } : req
        )
      }));
    }
    
    // Update appointment details with new form configuration
    setAppointmentDetails(prev => ({
      ...prev,
      formConfiguration: updatedFormConfig
    }));
  };

  // Get due appointments for auto-complete
  const getDueAppointments = (serviceName = 'All') => {
    return appointments.filter(appointment => {
      const isDue = isAppointmentDueOrOverdue(appointment);
      if (serviceName === 'All') {
        return isDue;
      }
      return isDue && appointment.ServiceName === serviceName;
    });
  };

  // Handle auto-complete appointments
  const handleAutoComplete = async () => {
    const dueAppointments = getDueAppointments(autoCompleteService);
    
    if (dueAppointments.length === 0) {
      setAlertMessage('No due appointments found for the selected service.');
      setAlertType('warning');
      setShowAutoCompleteModal(false);
      return;
    }

    setIsAutoCompleting(true);
    
    try {
      const appointmentIds = dueAppointments.map(apt => apt.AppointmentID);
      
      // Call backend API to bulk update appointments to completed
      await axios.put('/api/appointments/bulk-status-update', {
        appointment_ids: appointmentIds,
        status: 'Completed'
      });
      
      // Update local state
      const updatedAppointments = appointments.map(apt => 
        appointmentIds.includes(apt.AppointmentID) 
          ? { ...apt, Status: 'Completed' }
          : apt
      );
      
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      
      setAlertMessage(`Successfully completed ${dueAppointments.length} due appointment(s) for ${autoCompleteService === 'All' ? 'all services' : autoCompleteService}.`);
      setAlertType('success');
      
    } catch (err) {
      console.error('Error auto-completing appointments:', err);
      setAlertMessage('Failed to auto-complete appointments. Please try again.');
      setAlertType('error');
    } finally {
      setIsAutoCompleting(false);
      setShowAutoCompleteModal(false);
    }
  };

  // Review modal functions
  const handleViewAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
    setIsLoadingDetails(true);
    
    // Reset form data for new appointment
    setStaffFormData({});
    
    
    try {
      // Fetch detailed appointment information
      const response = await axios.get(`/api/appointments/${appointment.AppointmentID}`);
      console.log('Appointment details response:', response.data);
      console.log('Service data:', response.data?.service);
      console.log('isDownloadableContent:', response.data?.service?.isDownloadableContent);
      
      // Debug: Check all possible paths for isDownloadableContent
      console.log('Modal opened - checking isDownloadableContent paths:');
      console.log('service.isDownloadableContent:', response.data?.service?.isDownloadableContent);
      console.log('appointment.isDownloadableContent:', response.data?.isDownloadableContent);
      console.log('sacramentService.isDownloadableContent:', response.data?.sacramentService?.isDownloadableContent);
      
      setAppointmentDetails(response.data);
      
      // Initialize form data with saved answers from backend
      if (response.data?.formConfiguration?.form_elements) {
        const initialFormData = {};
        response.data.formConfiguration.form_elements.forEach(element => {
          if (element.answer && element.answer.trim() !== '') {
            initialFormData[element.id] = element.answer;
          }
        });
        console.log('Initializing form data with saved answers:', initialFormData);
        setStaffFormData(initialFormData);
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to load appointment details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedAppointment(null);
    setAppointmentDetails(null);
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    setIsUpdatingStatus(true);
    
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, {
        status: status
      });
      
      // Update local state
      const updatedAppointments = appointments.map(apt => 
        apt.AppointmentID === appointmentId 
          ? { ...apt, Status: status }
          : apt
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      
      // Update selected appointment in modal
      if (selectedAppointment?.AppointmentID === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, Status: status });
      }
      
      // Close modal after successful update
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1000);
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle confirm dialog actions
  const handleConfirmAction = () => {
    if (confirmAction) {
      const { appointmentId, status } = confirmAction;
      handleUpdateAppointmentStatus(appointmentId, status);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Show confirm dialog for status updates
  const showStatusConfirmDialog = (appointmentId, status) => {
    setConfirmAction({ appointmentId, status });
    setShowConfirmDialog(true);
  };
  
  // Handle appointment cancellation with custom category and note
  const handleCancelAppointment = async () => {
    if (!cancelAppointmentId || !cancellationData.note.trim()) {
      setAlertMessage('Please provide a cancellation note');
      setAlertType('error');
      return;
    }
    
    setIsUpdatingStatus(true);
    
    try {
      await axios.put(`/api/appointments/${cancelAppointmentId}/status`, {
        status: 'Cancelled',
        cancellation_category: cancellationData.category,
        cancellation_note: cancellationData.note
      });
      
      setAlertMessage('Appointment cancelled successfully');
      setAlertType('success');
      
      // Update local state
      const updatedAppointments = appointments.map(apt =>
        apt.AppointmentID === cancelAppointmentId 
          ? { ...apt, Status: 'Cancelled', cancellation_category: cancellationData.category, cancellation_note: cancellationData.note }
          : apt
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      
      // Update selected appointment in modal
      if (selectedAppointment?.AppointmentID === cancelAppointmentId) {
        setSelectedAppointment({ ...selectedAppointment, Status: 'Cancelled' });
      }
      
      // Close modals
      setShowCancelModal(false);
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1000);
      
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setAlertMessage('Failed to cancel appointment');
      setAlertType('error');
    } finally {
      setIsUpdatingStatus(false);
      // Reset cancellation data
      setCancellationData({ category: 'no_fee', note: '' });
      setCancelAppointmentId(null);
    }
  };

  // Certificate generation functions
  const handleGenerateCertificate = () => {
      setShowCertificateTypeModal(true);
  };

  const handleCertificateTypeSelection = (type) => {
    setSelectedCertificateType(type);
      setShowCertificateTypeModal(false);
      setShowCertificateModal(true);
  };


  const handleSaveFormData = async () => {
    console.log('Save button clicked');
    console.log('Selected appointment:', selectedAppointment?.AppointmentID);
    console.log('Staff form data:', staffFormData);
    
    if (!selectedAppointment?.AppointmentID) {
      setAlertMessage('No appointment selected');
      setAlertType('error');
      return;
    }
    
    if (!staffFormData || Object.keys(staffFormData).length === 0) {
      setAlertMessage('Please fill out the form before saving');
      setAlertType('error');
      return;
    }

    setIsUpdatingStatus(true);
    
    try {
      console.log('Attempting to save form data...');
      const response = await axios.post(`/api/appointments/${selectedAppointment.AppointmentID}/staff-form-data`, {
        formData: staffFormData
      });
      
      console.log('Save response:', response);
      setAlertMessage('Form data saved successfully!');
      setAlertType('success');
      
      // Close modal after a short delay
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving form data:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save form data';
      setAlertMessage(`Error saving form data: ${errorMessage}`);
      setAlertType('error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedAppointment || !appointmentDetails) {
      alert('No appointment data available for export');
      return;
    }
    
    try {
      exportToPDF(appointmentDetails, staffFormData, selectedAppointment);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Generate Mass Intentions Report
  const handleGenerateMassReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Find the active service to get ServiceID
      const activeService = appointments.find(apt => apt.ServiceName === activeServiceTab);
      
      if (!activeService) {
        setAlertMessage('No service selected');
        setAlertType('error');
        setIsGeneratingReport(false);
        return;
      }

      console.log('Generating report with:', {
        service_id: activeService.ServiceID,
        date: reportDate,
        time: reportTime,
        serviceName: activeService.ServiceName
      });

      const response = await axios.post('/api/appointments/mass-intentions-report', {
        service_id: activeService.ServiceID,
        date: reportDate,
        schedule_time_id: reportTime
      }, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Mass_Intentions_${reportDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setAlertMessage('Report generated successfully!');
      setAlertType('success');
      setShowMassReportModal(false);
    } catch (err) {
      console.error('Error generating Mass report:', err);
      console.error('Error response:', err.response);
      
      // Try to parse error message from blob if it's JSON
      let errorMessage = 'Failed to generate Mass report. Please try again.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseErr) {
          console.error('Could not parse error response:', parseErr);
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setAlertMessage(errorMessage);
      setAlertType('error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Check if active service is a Mass service
  const isActiveMassService = () => {
    if (activeServiceTab === 'All') return false;
    const service = appointments.find(apt => apt.ServiceName === activeServiceTab);
    console.log('Checking Mass service:', { activeServiceTab, service, isMass: service?.isMass });
    return service?.isMass === true || service?.isMass === 1; // Check for both boolean and integer
  };

  // Reset report date and time when modal opens
  useEffect(() => {
    if (showMassReportModal) {
      setReportDate("");
      setReportTime("");
    }
  }, [showMassReportModal]);

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
                You do not have permission to access the Appointment page.
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
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            {alertMessage && (
              <div className="mb-6">
                <Alert
                  type={alertType}
                  message={alertMessage}
                  onClose={() => setAlertMessage("")}
                  autoClose={true}
                  autoCloseDelay={5000}
                />
              </div>
            )}
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Church Appointments
            </h1>
            
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Appointment Applications</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage and review sacrament appointment applications from members.</p>
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Pending applications older than 72 hours are highlighted in red and can be cancelled to free up slots.
                        </p>
                      </div>
                      
                      {/* Generate Report Button for Mass Services */}
                      {isActiveMassService() && (
                        <Button
                          onClick={() => setShowMassReportModal(true)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                          disabled={!canGenerateMassReport}
                          title={!canGenerateMassReport ? 'You do not have permission to generate Mass reports' : ''}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Warning Reports - Only show if there are records */}
                  {(() => {
                    const expiredCount = appointments.filter(a => isAppointmentExpired(a.created_at, a.Status)).length;
                    const dueCount = appointments.filter(a => isAppointmentDueOrOverdue(a)).length;
                    
                    if (expiredCount === 0 && dueCount === 0) return null;
                    
                    return (
                      <div className="px-6 py-4 bg-amber-50 border-t border-b border-amber-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pending 72h+ */}
                            {expiredCount > 0 && (
                              <WarningBlock
                                type="danger"
                                title="Pending over 72 hours"
                                description="These pending applications are older than 72 hours and can be cancelled to free up slots."
                                count={expiredCount}
                                onShow={() => { setWarningFilter('expired_pending'); setStatusFilter('All'); setActiveServiceTab('All'); setSearchTerm(''); setCurrentPage(1); }}
                                onClear={() => setWarningFilter('none')}
                                isActive={warningFilter === 'expired_pending'}
                              />
                            )}

                            {/* Approved due today/past */}
                            {dueCount > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <h3 className="text-sm font-medium text-gray-900">Approved due today or overdue</h3>
                                      <p className="mt-1 text-sm text-gray-600">These approved appointments are due today or past their scheduled date.</p>
                                      <div className="mt-3 flex items-center space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-900">
                                          {dueCount} appointment{dueCount !== 1 ? 's' : ''}
                                        </span>
                                        <Button
                                          onClick={() => { setWarningFilter('due_approved'); setStatusFilter('All'); setActiveServiceTab('All'); setSearchTerm(''); setCurrentPage(1); }}
                                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                          Show All
                                        </Button>
                                        {warningFilter === 'due_approved' && (
                                          <Button
                                            onClick={() => setWarningFilter('none')}
                                            variant="outline"
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-amber-100 hover:bg-amber-200 text-amber-800"
                                          >
                                            Clear
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col space-y-2 ml-4">
                                    <Button
                                      onClick={() => setShowAutoCompleteModal(true)}
                                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-md transition-colors whitespace-nowrap"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Auto-Complete All
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {warningFilter !== 'none' && (
                            <div className="md:w-auto">
                              <Button
                                variant="outline"
                                onClick={() => setWarningFilter('none')}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Clear warning filter
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Service Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-0 overflow-x-auto">
                      {["All", ...uniqueServices].map((serviceName) => {
                        const count = serviceName === "All" 
                          ? appointments.length 
                          : appointments.filter(apt => apt.ServiceName === serviceName).length;
                        
                        return (
                          <button
                            key={serviceName}
                            onClick={() => setActiveServiceTab(serviceName)}
                            className={`
                              relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer
                              ${
                                activeServiceTab === serviceName
                                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className="flex items-center space-x-2">
                              <span>{serviceName}</span>
                              <span className={`
                                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${
                                  activeServiceTab === serviceName
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }
                              `}>
                                {count}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                  
                  <div className="px-6 py-4 space-y-4">
                    {/* Status Filter Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</span>
                        {/* Clear All Filters Button */}
                        {(activeServiceTab !== "All" || statusFilter !== "All" || yearFilter !== "All" || searchTerm || warningFilter !== 'none' || focusAppointmentId) && (
                          <button
                            onClick={() => {
                              setActiveServiceTab('All');
                              setStatusFilter('All');
                              setYearFilter('All');
                              setSearchTerm('');
                              setWarningFilter('none');
                              setFocusAppointmentId(null);
                              setCurrentPage(1);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear All Filters
                          </button>
                        )}
                        {["All", "Pending", "Approved", "Completed", "Cancelled"].map((status) => {
                          const count = status === "All" 
                            ? (activeServiceTab === "All" ? appointments.length : appointments.filter(apt => apt.ServiceName === activeServiceTab).length)
                            : (activeServiceTab === "All" 
                                ? appointments.filter(apt => apt.Status === status).length
                                : appointments.filter(apt => apt.ServiceName === activeServiceTab && apt.Status === status).length);
                          
                          const getStatusButtonStyles = (status) => {
                            const isActive = statusFilter === status;
                            const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer";
                            
                            switch (status) {
                              case 'All':
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-gray-600 text-white border-gray-600 shadow-sm' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`;
                              case 'Pending':
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                }`;
                              case 'Approved':
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }`;
                              case 'Completed':
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                }`;
                              case 'Cancelled':
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`;
                              default:
                                return `${baseClasses} ${
                                  isActive 
                                    ? 'bg-gray-600 text-white border-gray-600 shadow-sm' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`;
                            }
                          };
                          
                          const getStatusIcon = (status) => {
                            switch (status) {
                              case 'Pending':
                                return <AlertTriangle className="w-3 h-3 mr-1" />;
                              case 'Approved':
                              case 'Completed':
                                return <Check className="w-3 h-3 mr-1" />;
                              case 'Cancelled':
                                return <X className="w-3 h-3 mr-1" />;
                              default:
                                return null;
                            }
                          };
                          
                          return (
                            <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={getStatusButtonStyles(status)}
                              disabled={count === 0}
                            >
                              {getStatusIcon(status)}
                              <span>{status}</span>
                              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Year Filter */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Filter by Year:</span>
                        </div>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const currentYearCount = appointments.filter(apt => new Date(apt.AppointmentDate).getFullYear() === currentYear).length;
                          const selectValue = yearFilter === currentYear.toString() ? 'current' : yearFilter;
                          return (
                            <select
                              value={selectValue}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === 'current') {
                                  setYearFilter(currentYear.toString());
                                } else {
                                  setYearFilter(v);
                                }
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px] cursor-pointer"
                            >
                              <option value="All">All Years ({appointments.length})</option>
                              <option value="current">This Year ({currentYearCount})</option>
                              <option value="" disabled>──────────</option>
                              {uniqueYears.map((year) => {
                                const yearCount = appointments.filter(apt => {
                                  const appointmentDate = new Date(apt.AppointmentDate);
                                  return appointmentDate.getFullYear() === year;
                                }).length;
                                return (
                                  <option key={year} value={year.toString()}>
                                    {year} ({yearCount})
                                  </option>
                                );
                              })}
                            </select>
                          );
                        })()}
                        
                        <div className="text-sm text-gray-600">
                          Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
                          {activeServiceTab !== "All" && ` for ${activeServiceTab}`}
                          {statusFilter !== "All" && ` with status: ${statusFilter}`}
                          {yearFilter !== "All" && ` in year ${yearFilter}`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Search and Pagination */}
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredAppointments.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search appointments..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8">
                              <DataLoading message="Loading appointments..." />
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                              {error}
                            </td>
                          </tr>
                        ) : currentAppointments.length > 0 ? (
                          currentAppointments.map((appointment) => {
                            const isExpired = isAppointmentExpired(appointment.created_at, appointment.Status);
                            const isDue = isAppointmentDueOrOverdue(appointment);
                            const isFocused = focusAppointmentId === appointment.AppointmentID;
                            return (
                            <tr key={appointment.AppointmentID} className={`hover:bg-gray-50 ${
                              isFocused ? 'bg-blue-100 border-l-4 border-l-blue-600 animate-pulse' :
                              isExpired ? 'bg-red-50 border-l-4 border-l-red-400' : 
                              isDue ? 'bg-amber-50 border-l-4 border-l-amber-400' : 
                              ''
                            }`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {appointment.UserName || 'Unknown User'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {appointment.UserEmail || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {appointment.ServiceName}
                                  </span>
                                  {appointment.SubServiceName && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {appointment.SubServiceName}
                                    </span>
                                  )}
                                </div>
                                {appointment.ServiceDescription && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {appointment.ServiceDescription}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <div>
                                    <div className="font-medium">
                                      {new Date(appointment.AppointmentDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    {appointment.StartTime && appointment.EndTime && (
                                      <div className="text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTime(appointment.StartTime)} - {formatTime(appointment.EndTime)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(appointment.Status, appointment.created_at)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleViewAppointment(appointment)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!canReviewAppointment}
                                    title={!canReviewAppointment ? 'You do not have permission to review appointments' : ''}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Review
                                  </Button>
                                  {isExpired && (
                                    <Button
                                      onClick={() => showStatusConfirmDialog(appointment.AppointmentID, 'Cancelled')}
                                      variant="outline"
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!canRejectApplication}
                                      title={!canRejectApplication ? 'You do not have permission to cancel appointments' : ''}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  )}
                                  {isDue && (
                                    <Button
                                      onClick={() => showStatusConfirmDialog(appointment.AppointmentID, 'Completed')}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 min-h-0 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!canMarkCompleted}
                                      title={!canMarkCompleted ? 'You do not have permission to mark appointments as completed' : ''}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Mark Completed
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                                <p>No appointments found.</p>
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl mx-auto relative"
            style={{
              width: '90vw',
              maxWidth: '90vw',
              maxHeight: '95vh',
              minHeight: '80vh'
            }}
            role="dialog"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="relative bg-gray-100 px-4 py-4 rounded-t-lg">
              <Button
                onClick={handleCloseReviewModal}
                variant="outline"
                className="absolute top-4 right-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
              <div className="flex items-center space-x-3 pr-16">
                <div>
                  <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                    Review Appointment
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedAppointment?.ServiceName} - {selectedAppointment?.UserName}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-4 overflow-y-auto" style={{
              maxHeight: 'calc(95vh - 140px)'
            }}>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {isLoadingDetails ? (
                  <>
                    {/* Loading skeleton for Appointment Information */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-1 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                          <div className="h-5 w-48 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                        <div className="h-6 w-20 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="mb-4">
                          <div className="space-y-2">
                            <div className="h-6 w-64 bg-gray-300 rounded animate-pulse"></div>
                            <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-4 w-36 bg-gray-300 rounded animate-pulse"></div>
                              <div className="h-3 w-32 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loading skeleton for form section */}
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="h-5 w-56 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-32 w-full bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </div>

                  </>
                ) : (
                  <>
                    {/* Appointment Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">Appointment Information</h3>
                        </div>
                        <div>
                          {getStatusBadge(selectedAppointment?.Status, selectedAppointment?.created_at)}
                        </div>
                      </div>
                    
                    <div className="space-y-4">
                      <div className="mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedAppointment?.ServiceName}</h4>
                          {selectedAppointment?.ServiceDescription && (
                            <p className="text-gray-600">{selectedAppointment.ServiceDescription}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Appointment Date</p>
                            <p className="text-gray-900">
                              {new Date(selectedAppointment?.AppointmentDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            {selectedAppointment?.StartTime && selectedAppointment?.EndTime && (
                              <p className="text-sm text-gray-600 mt-1">
                                {formatTime(selectedAppointment.StartTime)} - {formatTime(selectedAppointment.EndTime)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Applicant</p>
                            <p className="text-gray-900">{selectedAppointment?.UserName || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">{selectedAppointment?.UserEmail || 'No email provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes Section */}
                  {selectedAppointment?.Notes && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-amber-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Special Notes</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-gray-900 leading-relaxed">{selectedAppointment.Notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Sacrament Application Form Section */}
                  {appointmentDetails?.formConfiguration && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Sacrament Application Form</h3>
                        <p className="text-sm text-gray-600 ml-2">Fill out the form for this applicant</p>
                      </div>
                      
                      <div style={{
                        minHeight: '600px',
                        width: '100%',
                        overflow: 'visible',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '800px',
                          margin: '0 auto'
                        }}>
                          <FormRenderer
                            formConfiguration={appointmentDetails.formConfiguration}
                            formData={staffFormData}
                            updateField={(fieldName, value) => {
                              console.log('Staff updating field:', fieldName, 'to:', value);
                              setStaffFormData(prev => ({
                                ...prev,
                                [fieldName]: value
                              }));
                            }}
                            readOnly={false}
                            appointmentId={selectedAppointment?.AppointmentID}
                            onSubmissionStatusChange={handleSubmissionStatusChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            {!isLoadingDetails && (
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex space-x-3">
                  {appointmentDetails?.formConfiguration && selectedAppointment?.Status !== 'Cancelled' && (
                    <Button
                      onClick={() => handleSaveFormData()}
                      variant="outline"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUpdatingStatus || !canSaveFormData}
                      title={!canSaveFormData ? 'You do not have permission to save form data' : ''}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Save Form Data
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {selectedAppointment?.Status === 'Pending' && (
                    <>
                      <Button
                        onClick={() => {
                          setCancelAppointmentId(selectedAppointment.AppointmentID);
                          setShowCancelModal(true);
                        }}
                        variant="outline"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingStatus || !canRejectApplication}
                        title={!canRejectApplication ? 'You do not have permission to cancel appointments' : ''}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Cancel Appointment'}
                      </Button>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Approved')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                        disabled={isUpdatingStatus || !canApproveAppointment || !canAcceptApplication}
                        title={
                          !canAcceptApplication ? 'You do not have permission to approve appointments' :
                          !canApproveAppointment ? 'All required submissions must be completed before approval' : ''
                        }
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Approve Appointment'}
                      </Button>
                    </>
                  )}
                  
                  {selectedAppointment?.Status === 'Approved' && (
                    <>
                      <Button
                        onClick={() => {
                          setCancelAppointmentId(selectedAppointment.AppointmentID);
                          setShowCancelModal(true);
                        }}
                        variant="outline"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingStatus || !canRejectApplication}
                        title={!canRejectApplication ? 'You do not have permission to cancel appointments' : ''}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Cancel Appointment'}
                      </Button>
                      <Button
                        onClick={() => showStatusConfirmDialog(selectedAppointment.AppointmentID, 'Completed')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingStatus || !canMarkCompleted}
                        title={!canMarkCompleted ? 'You do not have permission to mark appointments as completed' : ''}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Updating...' : 'Mark as Completed'}
                      </Button>
                    </>
                  )}
                  
                  {selectedAppointment?.Status === 'Completed' && 
                   (appointmentDetails?.service?.isCertificateGeneration || 
                    appointmentDetails?.sacramentService?.isCertificateGeneration) && (
                    <Button
                      onClick={handleGenerateCertificate}
                      className="flex items-center bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUpdatingStatus || !canGenerateCertificate}
                      title={!canGenerateCertificate ? 'You do not have permission to generate certificates' : ''}
                    >
                      <CertificateIcon className="h-4 w-4 mr-2" />
                      Generate Certificate
                    </Button>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl mx-auto relative w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationData({ category: 'no_fee', note: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUpdatingStatus}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Cancellation Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Category <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    cancellationData.category === 'no_fee' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }">
                    <input
                      type="radio"
                      name="category"
                      value="no_fee"
                      checked={cancellationData.category === 'no_fee'}
                      onChange={(e) => setCancellationData({ ...cancellationData, category: e.target.value })}
                      className="mr-3"
                      disabled={isUpdatingStatus}
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Green
                        </span>
                        <span className="font-medium text-gray-900">No Convenience Fee</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Full refund</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    cancellationData.category === 'with_fee' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }">
                    <input
                      type="radio"
                      name="category"
                      value="with_fee"
                      checked={cancellationData.category === 'with_fee'}
                      onChange={(e) => setCancellationData({ ...cancellationData, category: e.target.value })}
                      className="mr-3"
                      disabled={isUpdatingStatus}
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                          Red
                        </span>
                        <span className="font-medium text-gray-900">With Convenience Fee</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Partial refund</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cancellation Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason/Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationData.note}
                  onChange={(e) => setCancellationData({ ...cancellationData, note: e.target.value })}
                  placeholder="Provide a reason for cancellation..."
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUpdatingStatus}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This note will be visible in refund processing</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationData({ category: 'no_fee', note: '' });
                }}
                variant="outline"
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCancelAppointment}
                disabled={isUpdatingStatus || !cancellationData.note.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2 inline-block" />
                    Confirm Cancellation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title="Confirm Status Update"
        message={
          confirmAction?.status === 'Completed' 
            ? 'Are you sure you want to mark this appointment as completed?'
            : confirmAction?.status === 'Cancelled'
            ? 'Are you sure you want to cancel this appointment?'
            : confirmAction?.status === 'Approved'
            ? 'Are you sure you want to approve this appointment?'
            : `Are you sure you want to update this appointment status to ${confirmAction?.status}?`
        }
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        type={confirmAction?.status === 'Cancelled' ? 'warning' : confirmAction?.status === 'Completed' ? 'info' : 'info'}
        isLoading={isUpdatingStatus}
      />

      {/* Certificate Type Selection Modal */}
      <CertificateTypeModal
        isOpen={showCertificateTypeModal}
        onClose={() => setShowCertificateTypeModal(false)}
        onSelectType={handleCertificateTypeSelection}
      />

      {/* Certificate Generator Modal */}
      <CertificateGenerator
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        selectedAppointment={selectedAppointment}
        certificateType={selectedCertificateType}
        staffFormData={staffFormData}
      />

      {/* Auto-Complete Modal */}
      {showAutoCompleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Auto-Complete Due Appointments</h3>
              <button
                onClick={() => setShowAutoCompleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isAutoCompleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Service to Auto-Complete:
                </label>
                <select
                  value={autoCompleteService}
                  onChange={(e) => setAutoCompleteService(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isAutoCompleting}
                >
                  <option value="All">All Services ({getDueAppointments('All').length} appointments)</option>
                  {uniqueServices.map(service => {
                    const dueCount = getDueAppointments(service).length;
                    return (
                      <option key={service} value={service} disabled={dueCount === 0}>
                        {service} ({dueCount} appointments)
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">About to complete:</p>
                    <p>{getDueAppointments(autoCompleteService).length} approved appointment{getDueAppointments(autoCompleteService).length !== 1 ? 's' : ''} 
                    {autoCompleteService === 'All' ? ' from all services' : ` from ${autoCompleteService}`} 
                    that are due today or overdue.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowAutoCompleteModal(false)}
                variant="outline"
                disabled={isAutoCompleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAutoComplete}
                disabled={isAutoCompleting || getDueAppointments(autoCompleteService).length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isAutoCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Auto-Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Report Modal */}
      {showMassReportModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate Mass Intentions Report</h3>
              <button
                onClick={() => setShowMassReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isGeneratingReport}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date:
                </label>
                <select
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setReportTime(""); // Reset time when date changes
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  disabled={isGeneratingReport}
                >
                  <option value="">Select a date</option>
                  {(() => {
                    // Get unique dates from approved appointments for the active Mass service
                    const activeService = appointments.find(apt => apt.ServiceName === activeServiceTab);
                    if (!activeService) return null;
                    
                    const approvedDates = [...new Set(
                      appointments
                        .filter(apt => 
                          apt.ServiceID === activeService.ServiceID && 
                          apt.Status === 'Approved'
                        )
                        .map(apt => {
                          const date = new Date(apt.AppointmentDate);
                          return date.toISOString().split('T')[0];
                        })
                    )].sort((a, b) => new Date(a) - new Date(b));
                    
                    return approvedDates.map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </option>
                    ));
                  })()}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a date to generate report for approved Mass appointments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time:
                </label>
                <select
                  value={reportTime}
                  onChange={(e) => setReportTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isGeneratingReport || !reportDate}
                >
                  <option value="">Select a time</option>
                  {(() => {
                    if (!reportDate) return null;
                    
                    // Get unique times from approved appointments for the selected date
                    const activeService = appointments.find(apt => apt.ServiceName === activeServiceTab);
                    if (!activeService) return null;
                    
                    const filteredAppointments = appointments.filter(apt => {
                      const date = new Date(apt.AppointmentDate);
                      const aptDate = date.toISOString().split('T')[0];
                      return apt.ServiceID === activeService.ServiceID && 
                             apt.Status === 'Approved' &&
                             aptDate === reportDate;
                    });
                    
                    console.log('Filtered appointments for time dropdown:', filteredAppointments);
                    
                    const approvedTimes = [...new Map(
                      filteredAppointments
                        .map(apt => {
                          console.log('Appointment time data:', {
                            id: apt.ScheduleTimeID,
                            startTime: apt.StartTime,
                            endTime: apt.EndTime
                          });
                          return [
                            apt.ScheduleTimeID,
                            {
                              id: apt.ScheduleTimeID,
                              startTime: apt.StartTime,
                              endTime: apt.EndTime
                            }
                          ];
                        })
                    ).values()].sort((a, b) => {
                      // Sort by start time
                      const timeA = a.startTime || '00:00:00';
                      const timeB = b.startTime || '00:00:00';
                      return timeA.localeCompare(timeB);
                    });
                    
                    console.log('Approved times:', approvedTimes);
                    
                    return approvedTimes.map(time => {
                      const formatTime = (timeStr) => {
                        if (!timeStr) return 'N/A';
                        try {
                          const [hours, minutes] = timeStr.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          return `${displayHour}:${minutes} ${ampm}`;
                        } catch {
                          return timeStr;
                        }
                      };
                      
                      return (
                        <option key={time.id} value={time.id}>
                          {formatTime(time.startTime)} - {formatTime(time.endTime)}
                        </option>
                      );
                    });
                  })()}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a time slot for the report
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Report will include:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>All Mass intention form responses</li>
                      <li>Row numbering for each entry</li>
                    </ul>
                    <p className="mt-2 text-xs">Only approved appointments for the selected date and time will be included.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowMassReportModal(false)}
                variant="outline"
                disabled={isGeneratingReport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateMassReport}
                disabled={isGeneratingReport || !reportDate || !reportTime}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const AppointmentPageWrapper = () => {
  return (
    <Suspense fallback={<DataLoading message="Loading appointments..." />}>
      <AppointmentPage />
    </Suspense>
  );
};

export default AppointmentPageWrapper;
