"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const InlineCalendar = ({ value, onChange, className = "" }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize currentMonth based on selected value
  useEffect(() => {
    if (value) {
      const selectedDate = new Date(value);
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const selectDate = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selectedDate.toISOString().split('T')[0];
    onChange(dateString);
  };

  const selectedDate = value ? new Date(value) : null;
  const today = new Date();

  return (
    <div className={`bg-white border border-gray-300 rounded-md p-4 mt-1 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        
        <h3 className="text-sm font-medium text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
          <div key={`empty-${index}`} className="p-1 h-7"></div>
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              disabled={isPast}
              className={`
                p-1 h-7 text-xs rounded hover:bg-blue-50 transition-colors disabled:cursor-not-allowed disabled:text-gray-300
                ${isSelected 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : isToday && !isPast
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : isPast
                      ? 'text-gray-300'
                      : 'text-gray-900 hover:bg-blue-50'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected date display */}
      {value && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Selected: <span className="font-medium text-gray-900">
              {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default InlineCalendar;
