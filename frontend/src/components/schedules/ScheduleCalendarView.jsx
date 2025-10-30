"use client";
import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Users, 
  Plus
} from "lucide-react";
import { Button } from "@/components/Button.jsx";

const ScheduleCalendarView = ({ 
  schedules = [], 
  filteredSchedules = [],
  onEditSchedule,
  onDeleteSchedule,
  onCreateSchedule,
  selectedService,
  searchTerm,
  canEditSchedule = true,
  canDeleteSchedule = true,
  canAddSchedule = true
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Helper functions for calendar
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    return filteredSchedules.filter(schedule => {
      if (!schedule.recurrences || schedule.recurrences.length === 0) return false;
      
      const recurrence = schedule.recurrences[0];
      const scheduleStartDate = new Date(schedule.StartDate);
      const scheduleEndDate = schedule.EndDate ? new Date(schedule.EndDate) : null;
      
      // Check if date is within schedule range
      if (date < scheduleStartDate) return false;
      if (scheduleEndDate && date > scheduleEndDate) return false;
      
      switch (recurrence.RecurrenceType) {
        case 'Weekly':
          return date.getDay() === recurrence.DayOfWeek;
        
        case 'MonthlyNth':
          const weekOfMonth = Math.ceil(date.getDate() / 7);
          return date.getDay() === recurrence.DayOfWeek && 
                 weekOfMonth === recurrence.WeekOfMonth;
        
        case 'OneTime':
          // Parse the specific date and normalize to midnight local time to avoid timezone issues
          const specificDate = new Date(recurrence.SpecificDate);
          const normalizedSpecificDate = new Date(
            specificDate.getFullYear(),
            specificDate.getMonth(),
            specificDate.getDate()
          );
          const normalizedCheckDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          return normalizedCheckDate.getTime() === normalizedSpecificDate.getTime();
        
        default:
          return false;
      }
    });
  };

  const hasSchedulesOnDate = (date) => {
    return getSchedulesForDate(date).length > 0;
  };

  const formatTimes = (times) => {
    if (!times || times.length === 0) return "No times";
    return times.map(time => {
      const start = new Date(`2000-01-01T${time.StartTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(`2000-01-01T${time.EndTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }).join(", ");
  };


  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-200 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-200 rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

        <div className="flex-1 flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded-md">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
              <div key={`empty-${index}`} className="p-3 h-24 bg-gray-50 rounded-md"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const today = new Date();
              const isToday = isSameDay(date, today);
              const hasSchedules = hasSchedulesOnDate(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const schedulesForDay = getSchedulesForDate(date);
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(hasSchedules ? date : null)}
                  className={`
                    p-3 h-24 rounded-md border-2 transition-all relative flex flex-col
                    ${isSelected 
                      ? 'bg-blue-100 border-blue-500' 
                      : hasSchedules 
                        ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        : 'bg-gray-50 border-gray-100 cursor-default'
                    }
                    ${isToday ? 'ring-2 ring-blue-200' : ''}
                  `}
                >
                  <span className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-blue-600' : hasSchedules ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day}
                  </span>
                  
                  {hasSchedules && (
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {schedulesForDay.slice(0, 1).map((schedule, idx) => {
                        const displayName = schedule.sub_sacrament_service 
                          ? `${schedule.service?.ServiceName} (${schedule.sub_sacrament_service.SubServiceName})`
                          : schedule.service?.ServiceName;
                        return (
                          <div 
                            key={idx} 
                            className="text-xs bg-blue-500 text-white px-1.5 py-1 rounded text-center font-medium truncate"
                            title={displayName}
                          >
                            {displayName}
                          </div>
                        );
                      })}
                      {schedulesForDay.length > 1 && (
                        <div className="text-xs text-gray-500 text-center font-medium">
                          +{schedulesForDay.length - 1} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Always visible */}
        <div className="w-80 bg-white border border-gray-200 rounded-lg flex flex-col">
          {selectedDate ? (
            /* Selected Date View */
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {getSchedulesForDate(selectedDate).map((schedule) => {
                    const displayName = schedule.sub_sacrament_service 
                      ? `${schedule.service?.ServiceName} (${schedule.sub_sacrament_service.SubServiceName})`
                      : schedule.service?.ServiceName;
                    return (
                      <div key={schedule.ScheduleID} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900">
                            {displayName}
                          </h4>
                          <p className="text-sm text-gray-500">Schedule #{schedule.ScheduleID}</p>
                        </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTimes(schedule.times)}</span>
                        </div>

                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Capacity: {schedule.SlotCapacity}</span>
                        </div>

                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
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
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <Button
                  onClick={() => onCreateSchedule()}
                  className="w-full flex items-center justify-center"
                  variant="outline"
                  disabled={!canAddSchedule}
                  title={!canAddSchedule ? 'You do not have permission to add schedules' : ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </>
          ) : (
            /* No Date Selected - Just Show Add Button */
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Button
                onClick={() => onCreateSchedule()}
                className="flex items-center justify-center"
                variant="outline"
                disabled={!canAddSchedule}
                title={!canAddSchedule ? 'You do not have permission to add schedules' : ''}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ScheduleCalendarView;
