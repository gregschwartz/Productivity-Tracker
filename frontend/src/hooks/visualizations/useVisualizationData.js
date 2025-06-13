import { useState, useEffect } from 'react';
import { getApiUrl, apiGet } from '../../utils/api';
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
      // Load all tasks by fetching all pages
      let allTasks = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        let endpoint = `/tasks/?limit=${limit}&offset=${offset}`;
        
        // Only add date parameters if both dates are provided
        if (startDate && endDate) {
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');
          endpoint += `&start_date=${startDateStr}&end_date=${endDateStr}`;
        }
        
        const data = await apiGet(endpoint);
        allTasks = allTasks.concat(data.tasks || []);
        hasMore = data.has_more || false;
        offset += limit;
      }
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks from server.');
    }
  };

  /**
   * Load summaries from the backend API
   */
  const loadSummaries = async () => {
    try {
      // Load all summaries by fetching all pages
      let allSummaries = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const endpoint = `/summaries/?limit=${limit}&offset=${offset}`;
        const data = await apiGet(endpoint);
        allSummaries = allSummaries.concat(data.summaries || []);
        hasMore = data.has_more || false;
        offset += limit;
      }
      
      setSummaries(allSummaries);
    } catch (error) {
      console.error('Failed to load summaries:', error);
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
        console.log('Loading data with date range:', { startDate, endDate, timeRange });
        await Promise.all([
          loadTasks(startDate, endDate),
          loadSummaries()
        ]);
      } catch (error) {
        console.error('Error in loadData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange]); // React to time range changes only

  return {
    tasks,
    summaries,
    isLoading,
    error,
    stats,
    updateStats
  };
};