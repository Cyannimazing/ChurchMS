"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CustomDatePicker = ({ value, onChange }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      // Parse the date string correctly without timezone conversion
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Format date as YYYY-MM-DD without timezone conversion
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateString);
  };

  const isSelected = (day) => {
    if (!value) return false;
    const [year, month, selectedDay] = value.split('-').map(Number);
    return (
      year === currentDate.getFullYear() &&
      month === currentDate.getMonth() + 1 &&
      selectedDay === day
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  const isPastDate = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = [];
  const totalDays = daysInMonth(currentDate);
  const startDay = firstDayOfMonth(currentDate);

  // Empty cells for days before the first day of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-16"></div>);
  }

  // Actual days of the month
  for (let day = 1; day <= totalDays; day++) {
    const selected = isSelected(day);
    const today = isToday(day);
    const past = isPastDate(day);

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !past && handleDateClick(day)}
        disabled={past}
        className={`h-12 rounded-lg font-medium text-base transition-all duration-200 ${
          selected
            ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 ring-offset-1 cursor-pointer'
            : today
            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 cursor-pointer'
            : past
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-900 hover:bg-gray-100 cursor-pointer'
        } ${!past && !selected ? 'hover:shadow-md' : ''}`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        
        <h3 className="text-xl font-bold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-semibold text-gray-600 py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
};

export default CustomDatePicker;
