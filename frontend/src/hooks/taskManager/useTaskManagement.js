import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../utils/api';
import { getLocalToday, addDaysToDateString } from '../../utils/dateUtils';

/**
 * Custom hook for managing task CRUD operations and state with pagination
 */
export const useTaskManagement = (selectedDate) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20, // Default page size
    offset: 0,
    hasMore: false
  });

  /**
   * Load tasks from the backend API for current date with pagination
   */
  const loadTasks = useCallback(async (dateFilter = null, pageSize = 20, pageOffset = 0, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/tasks/`;
      
      // Always apply a date filter - use selectedDate or today (local timezone)
      const targetDate = dateFilter || getLocalToday();
      url += `?start_date=${targetDate}&end_date=${targetDate}&limit=${pageSize}&offset=${pageOffset}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update pagination state
      setPagination({
        total: data.total || 0,
        limit: data.limit || pageSize,
        offset: data.offset || pageOffset,
        hasMore: data.has_more || false
      });
      
      // Sort tasks reverse chronologically
      const sortedTasks = (data.tasks || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Either append to existing tasks or replace them
      if (append) {
        setTasks(prevTasks => [...prevTasks, ...sortedTasks]);
      } else {
        setTasks(sortedTasks);
      }
    } catch (error) {
      setError('Failed to load tasks from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load more tasks (for pagination)
   */
  const loadMoreTasks = useCallback(async () => {
    if (!pagination.hasMore || isLoading) return;
    
    const nextOffset = pagination.offset + pagination.limit;
    await loadTasks(selectedDate, pagination.limit, nextOffset, true);
  }, [selectedDate, pagination, isLoading, loadTasks]);

  /**
   * Refresh tasks (reload first page)
   */
  const refreshTasks = useCallback(async () => {
    await loadTasks(selectedDate, pagination.limit, 0, false);
  }, [selectedDate, pagination.limit, loadTasks]);

  /**
   * Add a new task to the backend and local state
   */
  const addTask = async (task, targetDate = null) => {
    let dateToUse;
    if (task.date_worked && task.date_worked.includes('T')) {
      // Already a full datetime string
      dateToUse = task.date_worked;
    } else {
      dateToUse = targetDate || task.date_worked || selectedDate || getLocalToday();
    }
    const newTask = {
      ...task,
      date_worked: dateToUse,
      id: undefined
    };

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
      }

      const createdTask = await response.json();
      
      // Add new task to the beginning of the list and update pagination total
      setTasks(prevTasks => [createdTask, ...prevTasks]);
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));
    } catch (error) {
      setError('Failed to save task to server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Update an existing task in the backend and local state
   */
  const updateTask = async (taskId, updatedTask) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
      }

      const updatedTaskFromServer = await response.json();
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTaskFromServer : task
        )
      );
    } catch (error) {
      setError('Failed to update task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Delete a task from the backend and local state
   */
  const deleteTask = async (taskId) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
      }

      // Remove task from local state and update pagination total
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      setError('Failed to delete task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  // Load tasks when selectedDate changes
  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate, loadTasks]);

  // Sort tasks by date (already sorted by creation in loadTasks, but ensure consistency)
  const sortedTasks = Array.isArray(tasks) ? tasks.sort((a, b) => new Date(b.date_worked) - new Date(a.date_worked)) : [];

  return {
    tasks: sortedTasks,
    isLoading,
    error,
    pagination,
    loadTasks,
    loadMoreTasks,
    refreshTasks,
    addTask,
    updateTask,
    deleteTask,
    setError
  };
};