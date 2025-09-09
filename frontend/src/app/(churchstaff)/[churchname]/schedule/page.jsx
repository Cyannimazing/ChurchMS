"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Settings,
  Trash2,
  Edit,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/Button.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import ScheduleModal from "@/components/schedules/ScheduleModal.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import DataLoading from "@/components/DataLoading.jsx";
import axios from "@/lib/axios";

const SchedulePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  // Check if user has access
  const hasAccess = user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "schedule_manage" || perm.PermissionName === "schedule_list"
    );

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [churchname, hasAccess]);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  // Filter schedules when service selection or search term changes
  useEffect(() => {
    let filtered = schedules;
    
    if (selectedService) {
      filtered = filtered.filter(schedule => schedule.ServiceID.toString() === selectedService);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.service?.ServiceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.ScheduleID.toString().includes(searchTerm)
      );
    }
    
    setFilteredSchedules(filtered);
  }, [schedules, selectedService, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load all services first
      const servicesResponse = await axios.get(`/api/sacrament-services/${churchname}`);
      if (servicesResponse.data?.sacraments) {
        setServices(servicesResponse.data.sacraments);
      }
      
      // Load all schedules for the church
      const schedulesPromises = servicesResponse.data.sacraments?.map(service => 
        axios.get(`/api/sacrament-services/${service.ServiceID}/schedules`).catch(() => ({ data: { schedules: [] } }))
      ) || [];
      
      const schedulesResponses = await Promise.all(schedulesPromises);
      const allSchedules = schedulesResponses.flatMap((response, index) => {
        const serviceSchedules = response.data?.schedules || [];
        return serviceSchedules.map(schedule => ({
          ...schedule,
          service: servicesResponse.data.sacraments[index]
        }));
      });
      
      setSchedules(allSchedules);
      setFilteredSchedules(allSchedules);
      
    } catch (error) {
      console.error("Failed to load data:", error);
      setAlertMessage("Failed to load schedules. Please try again.");
      setAlertType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;

    try {
      const response = await axios.delete(`/api/schedules/${scheduleToDelete.ScheduleID}`);
      if (response.data.success) {
        setAlertMessage("Schedule deleted successfully!");
        setAlertType("success");
        loadData(); // Reload data
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      setAlertMessage("Failed to delete schedule. Please try again.");
      setAlertType("error");
    } finally {
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
    }
  };

  const formatRecurrence = (recurrences) => {
    if (!recurrences || recurrences.length === 0) return "No recurrence";
    
    const recurrence = recurrences[0]; // Assuming one recurrence per schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeks = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    
    switch (recurrence.RecurrenceType) {
      case 'Weekly':
        return `Every ${days[recurrence.DayOfWeek]}`;
      case 'MonthlyNth':
        return `${weeks[recurrence.WeekOfMonth - 1]} ${days[recurrence.DayOfWeek]} of every month`;
      case 'OneTime':
        return `One time on ${new Date(recurrence.SpecificDate).toLocaleDateString()}`;
      default:
        return 'Unknown recurrence';
    }
  };

  const formatTimes = (times) => {
    if (!times || times.length === 0) return "No times";
    return times.map(time => {
      const start = new Date(`2000-01-01T${time.StartTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(`2000-01-01T${time.EndTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }).join(", ");
  };

  const formatFees = (fees) => {
    if (!fees || fees.length === 0) return "Free";
    return fees.map(fee => 
      `${fee.FeeType}: $${parseFloat(fee.Fee).toFixed(2)}`
    ).join(", ");
  };

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">Unauthorized</h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Schedule Management page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Schedule Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage availability schedules for all church sacrament services
                </p>
              </div>
              
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center"
                disabled={services.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schedules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="sm:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">All Services</option>
                    {services.map((service) => (
                      <option key={service.ServiceID} value={service.ServiceID}>
                        {service.ServiceName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {alertMessage && (
            <div className="mx-6 mt-4">
              <div className={`p-4 rounded-md flex justify-between items-center ${
                alertType === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                <p className="text-sm font-medium">{alertMessage}</p>
                <button
                  onClick={() => setAlertMessage("")}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="py-12">
                <DataLoading message="Loading schedules..." />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
                <p className="text-gray-600 mb-6">
                  You need to create sacrament services before you can manage schedules.
                </p>
                <Button
                  onClick={() => router.push(`/${churchname}/sacrament`)}
                  className="flex items-center mx-auto"
                >
                  Go to Sacraments
                </Button>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedService ? 'No Schedules Found' : 'No Schedules Yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedService 
                    ? 'No schedules match your current filters.' 
                    : 'Get started by creating your first schedule for a service.'}
                </p>
                {!searchTerm && !selectedService && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSchedules.map((schedule) => (
                  <div key={schedule.ScheduleID} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {schedule.service?.ServiceName}
                        </h3>
                        <p className="text-sm text-gray-500">Schedule #{schedule.ScheduleID}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setEditingSchedule(schedule)}
                          variant="outline"
                          className="p-2 h-auto min-h-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(schedule)}
                          variant="outline"
                          className="p-2 h-auto min-h-0 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(schedule.StartDate).toLocaleDateString()} - {' '}
                          {schedule.EndDate ? new Date(schedule.EndDate).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Settings className="h-4 w-4 mr-2" />
                        <span>{formatRecurrence(schedule.recurrences)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatTimes(schedule.times)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          Capacity: {schedule.SlotCapacity}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>{formatFees(schedule.fees)}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          new Date(schedule.StartDate) <= new Date() && 
                          (!schedule.EndDate || new Date(schedule.EndDate) >= new Date())
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {new Date(schedule.StartDate) <= new Date() && 
                           (!schedule.EndDate || new Date(schedule.EndDate) >= new Date())
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                        
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          isOpen={showCreateModal || !!editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          schedule={editingSchedule}
          services={services}
          onSuccess={() => {
            loadData();
            setShowCreateModal(false);
            setEditingSchedule(null);
            setAlertMessage(editingSchedule ? "Schedule updated successfully!" : "Schedule created successfully!");
            setAlertType("success");
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        message={`Are you sure you want to delete this schedule for ${scheduleToDelete?.service?.ServiceName}? This action cannot be undone and will permanently remove all associated time slots, recurrences, and fees.`}
        confirmText="Delete Schedule"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SchedulePage;
