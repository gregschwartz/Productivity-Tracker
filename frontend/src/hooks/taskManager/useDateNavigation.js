import { useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';

/**
 * Custom hook for managing date navigation and calendar functionality
 */
export const useDateNavigation = (selectedDate, onDateChange, onClearDateFilter) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * Get the current working date (selected date or today)
   */
  const getCurrentDate = () => {
    if (selectedDate) {
      try {
        return parseISO(selectedDate);
      } catch (error) {
        return new Date();
      }
    }
    return new Date();
  };

  const currentDate = getCurrentDate();
  const currentDateString = format(currentDate, 'yyyy-MM-dd');
  const isToday = currentDateString === format(new Date(), 'yyyy-MM-dd');

  /**
   * Navigate to previous day
   */
  const handlePreviousDay = () => {
    const previousDay = subDays(currentDate, 1);
    const dateString = format(previousDay, 'yyyy-MM-dd');
    onDateChange(dateString);
  };

  /**
   * Navigate to next day
   */
  const handleNextDay = () => {
    const nextDay = addDays(currentDate, 1);
    const dateString = format(nextDay, 'yyyy-MM-dd');
    onDateChange(dateString);
  };

  /**
   * Navigate to today
   */
  const handleToday = () => {
    onClearDateFilter();
  };

  /**
   * Handle calendar date selection
   */
  const handleCalendarChange = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    if (dateString === format(new Date(), 'yyyy-MM-dd')) {
      onClearDateFilter();
    } else {
      onDateChange(dateString);
    }
    setShowDatePicker(false);
  };

  return {
    currentDate,
    currentDateString,
    isToday,
    showDatePicker,
    setShowDatePicker,
    handlePreviousDay,
    handleNextDay,
    handleToday,
    handleCalendarChange
  };
};