import { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { format } from 'date-fns';

/**
 * Custom hook for managing visualization data loading and state
 */
export const useVisualizationData = (timeRange, getDateRange) => {
  const [tasks, setTasks] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_tasks: 0,
    total_hours: 0,
    average_hours_per_task: 0,
    focus_hours: {}
  });

  /**
   * Load tasks from the backend API for selected time range
   */
  const loadTasks = async (startDate, endDate) => {
    try {
      const apiUrl = getApiUrl();
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      const url = `${apiUrl}/tasks/?start_date=${startDateStr}&end_date=${endDateStr}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Failed to load tasks from server.');
    }
  };

  /**
   * Load summaries from the backend API
   */
  const loadSummaries = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/summaries/`);
      if (!response.ok) {
        throw new Error(`Failed to load summaries: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSummaries(data);
    } catch (error) {
      setError('Failed to load summaries from server.');
    }
  };

  /**
   * Update statistics when filtered tasks change
   */
  const updateStats = async (filteredTasks) => {
    if (filteredTasks.length === 0) {
      setStats({ total_tasks: 0, total_hours: 0, average_hours_per_task: 0, focus_hours: {} });
      return;
    }

    try {
      const { calculateTaskStatistics } = await import('../../utils/api');
      const backendStats = await calculateTaskStatistics(filteredTasks);
      setStats(backendStats);
    } catch (error) {
      // Simple fallback
      const totalTasks = filteredTasks.length;
      const totalHours = filteredTasks.reduce((sum, task) => sum + task.time_spent, 0);
      setStats({
        total_tasks: totalTasks,
        total_hours: totalHours,
        average_hours_per_task: totalTasks > 0 ? totalHours / totalTasks : 0,
        focus_hours: {}
      });
    }
  };

  /**
   * Load data when component mounts or time range changes
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { startDate, endDate } = getDateRange;
        await Promise.all([
          loadTasks(startDate, endDate),
          loadSummaries()
        ]);
      } catch (error) {
        // Error is already handled in individual functions
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange]); // Remove getDateRange from dependencies to prevent infinite loop

  return {
    tasks,
    summaries,
    isLoading,
    error,
    stats,
    updateStats
  };
};