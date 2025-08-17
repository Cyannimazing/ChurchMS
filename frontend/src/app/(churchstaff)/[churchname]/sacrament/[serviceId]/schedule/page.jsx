"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Settings,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { Button } from "@/components/Button.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import ScheduleModal from "@/components/schedules/ScheduleModal.jsx";
import axios from "@/lib/axios";

const ServiceSchedulePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname, serviceId } = useParams();
  
  const [service, setService] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  // Check if user has access
  const hasAccess = user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "schedule_manage"
    );

  useEffect(() => {
    if (hasAccess) {
      loadSchedules();
    }
  }, [serviceId, hasAccess]);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/sacrament-services/${serviceId}/schedules`);
      if (response.data.success) {
        setService(response.data.service);
        setSchedules(response.data.schedules);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setAlertMessage("Failed to load schedules. Please try again.");
      setAlertType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/schedules/${scheduleId}`);
      if (response.data.success) {
        setAlertMessage("Schedule deleted successfully!");
        setAlertType("success");
        loadSchedules(); // Reload schedules
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      setAlertMessage("Failed to delete schedule. Please try again.");
      setAlertType("error");
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

  if (isLoading) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Schedules</h2>
                <p className="text-gray-600">Please wait while we load your service schedules...</p>
              </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push(`/${churchname}/sacrament`)}
                  variant="outline"
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sacraments
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Schedule Management
                  </h1>
                  <p className="text-sm text-gray-600">
                    {service ? `Configure availability for: ${service.ServiceName}` : 'Loading...'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
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
          <div className="flex-1 p-6">
            {schedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first availability schedule for this service.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((schedule) => (
                  <div key={schedule.ScheduleID} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Schedule #{schedule.ScheduleID}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setEditingSchedule(schedule)}
                          variant="outline"
                          className="p-2 h-auto min-h-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteSchedule(schedule.ScheduleID)}
                          variant="outline"
                          className="p-2 h-auto min-h-0 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
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
                          Capacity: {schedule.SlotCapacity} | Available: {schedule.RemainingSlot}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>{formatFees(schedule.fees)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
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
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          schedule.RemainingSlot > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.RemainingSlot > 0 ? 'Available' : 'Full'}
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

      {/* Create/Edit Schedule Modal would go here */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          isOpen={showCreateModal || !!editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          schedule={editingSchedule}
          serviceId={serviceId}
          onSuccess={() => {
            loadSchedules();
            setShowCreateModal(false);
            setEditingSchedule(null);
            setAlertMessage(editingSchedule ? "Schedule updated successfully!" : "Schedule created successfully!");
            setAlertType("success");
          }}
        />
      )}
    </div>
  );
};


export default ServiceSchedulePage;
