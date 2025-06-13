import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays, eachDayOfInterval, format } from 'date-fns';

/**
 * Custom hook for managing time range selection and calculations
 */
export const useTimeRange = (tasks) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month

  /**
   * Get date range based on selected time range
   */
  const getDateRange = useMemo(() => {
    console.log('getDateRange called with timeRange:', timeRange);
    const now = new Date();
    switch (timeRange) {
      case 'week':
        // Current week (Sunday to Saturday)
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
          days: 7
        };
      case 'month':
        // Show complete weeks for the current month
        const monthStartDate = startOfMonth(now);
        const monthEndDate = endOfMonth(now);
        
        // Start from the beginning of the first week that contains the start of the month
        const monthStartWeek = startOfWeek(monthStartDate);
        
        // Find the last Sunday that falls within the month
        let lastSundayInMonth = monthStartDate;
        let currentSunday = startOfWeek(monthStartDate);
        
        // Iterate through Sundays in the month
        while (currentSunday <= monthEndDate) {
          if (currentSunday >= monthStartDate && currentSunday <= monthEndDate) {
            lastSundayInMonth = currentSunday;
          }
          currentSunday = addDays(currentSunday, 7);
        }
        
        // End at the last day of the week that starts with the last Sunday in the month
        const monthEndWeek = endOfWeek(lastSundayInMonth);
        
        return {
          startDate: monthStartWeek,
          endDate: monthEndWeek,
          days: Math.ceil((monthEndWeek - monthStartWeek) / (1000 * 60 * 60 * 24))
        };
      default:
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
          days: 7
        };
    }
  }, [timeRange, tasks]);

  /**
   * Filter tasks based on selected time range
   */
  const filteredTasks = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      return [];
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.date_worked);
      return taskDate >= startDate && taskDate <= endDate;
    });
  }, [tasks, getDateRange]);

  /**
   * Prepare daily productivity data for charts
   */
  const dailyData = useMemo(() => {
    const { days } = getDateRange;
    const displayDays = Math.min(days, timeRange === 'week' ? 7 : 30);
    
    return Array.from({ length: displayDays }, (_, i) => {
      const date = subDays(new Date(), displayDays - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = filteredTasks.filter(task => task.date_worked === dateStr);
      
      // Count tasks and time by focus level
      const focusCount = { low: 0, medium: 0, high: 0 };
      const focusTime = { low: 0, medium: 0, high: 0 };
      
      dayTasks.forEach(task => {
        focusCount[task.focus_level]++;
        focusTime[task.focus_level] += task.time_spent;
      });
      
      return {
        date: format(date, timeRange === 'week' ? 'MMM dd' : 'MM/dd'),
        // Task counts
        low: focusCount.low,
        medium: focusCount.medium,
        high: focusCount.high,
        // Time spent
        lowTime: focusTime.low,
        mediumTime: focusTime.medium,
        highTime: focusTime.high,
        // Other charts
        tasks: dayTasks.length,
        hours: dayTasks.reduce((sum, task) => sum + task.time_spent, 0)
      };
    });
  }, [filteredTasks, getDateRange, timeRange]);

  /**
   * Prepare heatmap data based on selected time range
   */
  const heatmapData = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    
    // For specific date ranges
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = filteredTasks.filter(task => task.date_worked === dateStr);
      const totalHours = dayTasks.reduce((sum, task) => sum + task.time_spent, 0);
      
      const isFirstOfMonth = date.getDate() === 1;
      const monthName = isFirstOfMonth ? format(date, 'MMM') : null;
      
      return {
        date: dateStr,
        day: format(date, 'dd'),
        monthName,
        isFirstOfMonth,
        intensity: totalHours,
        tasks: dayTasks.length
      };
    });
  }, [filteredTasks, getDateRange, tasks]);

  /**
   * Get time range label for display
   */
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'the last 7 days';
      case 'month': return 'the last 30 days';
      default: return 'the last 7 days';
    }
  };

  return {
    timeRange,
    setTimeRange,
    getDateRange,
    filteredTasks,
    dailyData,
    heatmapData,
    getTimeRangeLabel
  };
};