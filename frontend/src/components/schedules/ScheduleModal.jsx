"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import axios from "@/lib/axios";

const ScheduleModal = ({ isOpen, onClose, schedule, services, onSuccess }) => {
  const [formData, setFormData] = useState({
    serviceId: "",
    startDate: "",
    endDate: "",
    slotCapacity: "",
    recurrences: [{
      recurrenceType: "OneTime",
      dayOfWeek: 0,
      weekOfMonth: 1,
      specificDate: ""
    }],
    times: [{
      startTime: "",
      endTime: ""
    }],
    fees: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const recurrenceTypes = [
    { value: "OneTime", label: "One Time Event" },
    { value: "Weekly", label: "Weekly" },
    { value: "MonthlyNth", label: "Monthly (Nth weekday)" }
  ];

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const weeksOfMonth = [
    { value: 1, label: "First" },
    { value: 2, label: "Second" },
    { value: 3, label: "Third" },
    { value: 4, label: "Fourth" },
    { value: 5, label: "Fifth" }
  ];

  const feeTypes = [
    "Fee",
    "Donation"
  ];

  useEffect(() => {
    if (schedule) {
      // Populate form with existing schedule data
      setFormData({
        serviceId: schedule.ServiceID || "",
        startDate: schedule.StartDate ? schedule.StartDate.split('T')[0] : "",
        endDate: schedule.EndDate ? schedule.EndDate.split('T')[0] : "",
        slotCapacity: schedule.SlotCapacity || "",
        recurrences: schedule.recurrences && schedule.recurrences.length > 0 
          ? schedule.recurrences.map(r => ({
              recurrenceType: r.RecurrenceType,
              dayOfWeek: r.DayOfWeek || 0,
              weekOfMonth: r.WeekOfMonth || 1,
              specificDate: r.SpecificDate ? r.SpecificDate.split('T')[0] : ""
            }))
          : [{
              recurrenceType: "OneTime",
              dayOfWeek: 0,
              weekOfMonth: 1,
              specificDate: ""
            }],
        times: schedule.times && schedule.times.length > 0
          ? schedule.times.map(t => ({
              startTime: t.StartTime || "",
              endTime: t.EndTime || ""
            }))
          : [{
              startTime: "",
              endTime: ""
            }],
        fees: schedule.fees && schedule.fees.length > 0
          ? schedule.fees.map(f => ({
              feeType: f.FeeType,
              fee: f.Fee
            }))
          : []
      });
    } else {
      // Reset form for new schedule
      setFormData({
        serviceId: "",
        startDate: "",
        endDate: "",
        slotCapacity: "",
        recurrences: [{
          recurrenceType: "OneTime",
          dayOfWeek: 0,
          weekOfMonth: 1,
          specificDate: ""
        }],
        times: [{
          startTime: "",
          endTime: ""
        }],
        fees: []
      });
    }
    setErrors({});
  }, [schedule]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceId) {
      newErrors.serviceId = "Service is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.slotCapacity || formData.slotCapacity < 1) {
      newErrors.slotCapacity = "Slot capacity must be at least 1";
    }

    // Validate recurrences
    formData.recurrences.forEach((recurrence, index) => {
      if (recurrence.recurrenceType === "OneTime" && !recurrence.specificDate) {
        newErrors[`recurrence_${index}_date`] = "Specific date is required for one-time events";
      }
    });

    // Validate times
    formData.times.forEach((time, index) => {
      if (!time.startTime) {
        newErrors[`time_${index}_start`] = "Start time is required";
      }
      if (!time.endTime) {
        newErrors[`time_${index}_end`] = "End time is required";
      }
      if (time.startTime && time.endTime && time.startTime >= time.endTime) {
        newErrors[`time_${index}_end`] = "End time must be after start time";
      }
    });

    // Validate fees
    formData.fees.forEach((fee, index) => {
      if (!fee.feeType) {
        newErrors[`fee_${index}_type`] = "Fee type is required";
      }
      if (!fee.fee || fee.fee < 0) {
        newErrors[`fee_${index}_amount`] = "Fee amount must be 0 or greater";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        slot_capacity: parseInt(formData.slotCapacity),
        recurrences: formData.recurrences.map(r => ({
          recurrence_type: r.recurrenceType,
          day_of_week: r.recurrenceType !== "OneTime" ? r.dayOfWeek : null,
          week_of_month: r.recurrenceType === "MonthlyNth" ? r.weekOfMonth : null,
          specific_date: r.recurrenceType === "OneTime" ? r.specificDate : null
        })),
        times: formData.times.map(t => ({
          start_time: t.startTime,
          end_time: t.endTime
        })),
        fees: formData.fees.map(f => ({
          fee_type: f.feeType,
          fee: parseFloat(f.fee)
        }))
      };

      let response;
      if (schedule) {
        // Update existing schedule
        response = await axios.put(`/api/schedules/${schedule.ScheduleID}`, payload);
      } else {
        // Create new schedule
        response = await axios.post(`/api/sacrament-services/${formData.serviceId}/schedules`, payload);
      }

      if (response.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setErrors({ submit: "Failed to save schedule. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const addRecurrence = () => {
    setFormData({
      ...formData,
      recurrences: [...formData.recurrences, {
        recurrenceType: "OneTime",
        dayOfWeek: 0,
        weekOfMonth: 1,
        specificDate: ""
      }]
    });
  };

  const removeRecurrence = (index) => {
    setFormData({
      ...formData,
      recurrences: formData.recurrences.filter((_, i) => i !== index)
    });
  };

  const updateRecurrence = (index, field, value) => {
    const newRecurrences = [...formData.recurrences];
    newRecurrences[index] = { ...newRecurrences[index], [field]: value };
    setFormData({ ...formData, recurrences: newRecurrences });
  };

  const addTime = () => {
    setFormData({
      ...formData,
      times: [...formData.times, { startTime: "", endTime: "" }]
    });
  };

  const removeTime = (index) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    });
  };

  const updateTime = (index, field, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = { ...newTimes[index], [field]: value };
    setFormData({ ...formData, times: newTimes });
  };

  const addFee = () => {
    setFormData({
      ...formData,
      fees: [...formData.fees, { feeType: "Fee", fee: "0.00" }]
    });
  };

  const removeFee = (index) => {
    setFormData({
      ...formData,
      fees: formData.fees.filter((_, i) => i !== index)
    });
  };

  const updateFee = (index, field, value) => {
    const newFees = [...formData.fees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFormData({ ...formData, fees: newFees });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 relative max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <Button
          onClick={onClose}
          variant="outline"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 min-h-0 h-auto border-none hover:bg-gray-50 rounded-full z-10 transition-all duration-200"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="px-8 py-6 border-b border-gray-100">
          <h2
            id="modal-title"
            className="text-2xl font-bold text-gray-900 pr-12"
          >
            {schedule ? "Edit Schedule" : "Create New Schedule"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {schedule ? "Update the schedule details below" : "Fill in the details to create a new schedule"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Schedule Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                Schedule Details
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!schedule && (
                    <div className="md:col-span-2">
                      <Label
                        htmlFor="serviceId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Service *
                      </Label>
                      <select
                        id="serviceId"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm ${
                          formData.serviceId === '' ? 'text-gray-400' : 'text-gray-900'
                        }`}
                        required
                      >
                        <option value="" disabled hidden>Select a service...</option>
                        {services.map((service) => (
                          <option key={service.ServiceID} value={service.ServiceID}>
                            {service.ServiceName}
                          </option>
                        ))}
                      </select>
                      <InputError
                        messages={errors.serviceId ? [errors.serviceId] : []}
                        className="mt-2 text-xs text-red-600"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label
                      htmlFor="startDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        formData.startDate === '' ? 'text-gray-400' : 'text-gray-900'
                      }`}
                      required
                    />
                    <InputError
                      messages={errors.startDate ? [errors.startDate] : []}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="endDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      End Date (Optional)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      placeholder="Select end date"
                      className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 ${
                        formData.endDate === '' ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="slotCapacity"
                      className="text-sm font-medium text-gray-700"
                    >
                      Slot Capacity *
                    </Label>
                    <Input
                      id="slotCapacity"
                      type="number"
                      min="1"
                      placeholder="Enter slot capacity"
                      value={formData.slotCapacity}
                      onChange={(e) => {
                        const capacity = parseInt(e.target.value) || 0;
                        
                        setFormData({ 
                          ...formData, 
                          slotCapacity: capacity
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                      required
                    />
                    <InputError
                      messages={errors.slotCapacity ? [errors.slotCapacity] : []}
                      className="mt-2 text-xs text-red-600"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Recurrence Patterns */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                Recurrence Patterns
              </h3>
              <div className="space-y-6">
                {formData.recurrences.map((recurrence, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Pattern {index + 1}</h4>
                      {formData.recurrences.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeRecurrence(index)}
                          variant="outline"
                          className="p-2 h-auto min-h-0 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recurrence Type
                        </label>
                        <select
                          value={recurrence.recurrenceType}
                          onChange={(e) => updateRecurrence(index, 'recurrenceType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                        >
                          {recurrenceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {recurrence.recurrenceType === "OneTime" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specific Date *
                          </label>
                        <input
                          type="date"
                          value={recurrence.specificDate}
                          onChange={(e) => updateRecurrence(index, 'specificDate', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            recurrence.specificDate === '' ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        />
                          {errors[`recurrence_${index}_date`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`recurrence_${index}_date`]}</p>
                          )}
                        </div>
                      )}

                      {(recurrence.recurrenceType === "Weekly" || recurrence.recurrenceType === "MonthlyNth") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Day of Week
                          </label>
                          <select
                            value={recurrence.dayOfWeek}
                            onChange={(e) => updateRecurrence(index, 'dayOfWeek', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                          >
                            {daysOfWeek.map((day, dayIndex) => (
                              <option key={dayIndex} value={dayIndex}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {recurrence.recurrenceType === "MonthlyNth" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Week of Month
                          </label>
                          <select
                            value={recurrence.weekOfMonth}
                            onChange={(e) => updateRecurrence(index, 'weekOfMonth', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                          >
                            {weeksOfMonth.map(week => (
                              <option key={week.value} value={week.value}>
                                {week.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addRecurrence}
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recurrence Pattern
                </Button>
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-3 text-blue-600" />
                Time Slots
              </h3>
              <div className="space-y-6">
                {formData.times.map((time, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Time Slot {index + 1}</h4>
                      {formData.times.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTime(index)}
                          variant="outline"
                          className="p-2 h-auto min-h-0 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          placeholder="Select start time"
                          value={time.startTime}
                          onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 ${
                            time.startTime === '' ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        />
                        {errors[`time_${index}_start`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_start`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time *
                        </label>
                        <input
                          type="time"
                          placeholder="Select end time"
                          value={time.endTime}
                          onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 ${
                            time.endTime === '' ? 'text-gray-900' : 'text-gray-900'
                          }`}
                        />
                        {errors[`time_${index}_end`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`time_${index}_end`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addTime}
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>

            {/* Fees */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-blue-600" />
                Fees (Optional)
              </h3>
              <div className="space-y-6">
                {formData.fees.map((fee, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Fee {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeFee(index)}
                        variant="outline"
                        className="p-2 h-auto min-h-0 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fee Type
                        </label>
                        <select
                          value={fee.feeType}
                          onChange={(e) => updateFee(index, 'feeType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm text-gray-900"
                        >
                          {feeTypes.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        {errors[`fee_${index}_type`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`fee_${index}_type`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={fee.fee}
                          onChange={(e) => updateFee(index, 'fee', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 text-gray-900"
                        />
                        {errors[`fee_${index}_amount`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`fee_${index}_amount`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addFee}
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee
                </Button>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end items-center space-x-3 p-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="inline-flex items-center px-3 py-2 text-sm font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {schedule ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{schedule ? "Update Schedule" : "Create Schedule"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
