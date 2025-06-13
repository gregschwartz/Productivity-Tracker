import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, subDays, eachDayOfInterval, format } from 'date-fns';

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
    const endDate = endOfWeek(now);
    switch (timeRange) {
      case 'week':
        // Current week (Sunday to Saturday)
        return {
          startDate: startOfWeek(now),
          endDate: endDate,
          days: 7
        };
      case 'month':
        // Show exactly 4 complete weeks ending with current week
        const currentWeekStart = startOfWeek(now);
        const startDate = subDays(currentWeekStart, 21); // 3 weeks back (3 * 7 = 21 days)
        
        return {
          startDate: startDate,
          endDate: endDate,
          days: 28
        };
      default:
        return {
          startDate: startOfWeek(now),
          endDate: endDate,
          days: 7
        };
    }
  }, [timeRange]);

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
    const { startDate, endDate } = getDateRange;
    
    // Generate data for each day in the date range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map((date) => {
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
  }, [filteredTasks, getDateRange]);

  /**
   * Get time range label for display
   */
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'the last 7 days';
      case 'month': return 'the last 4 weeks';
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