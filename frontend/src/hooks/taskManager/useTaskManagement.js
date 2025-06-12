import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../utils/api';
import { getLocalToday, addDaysToDateString } from '../../utils/dateUtils';

/**
 * Custom hook for managing task CRUD operations and state
 */
export const useTaskManagement = (selectedDate, onTasksChange) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load tasks from the backend API for current date
   */
  const loadTasks = useCallback(async (dateFilter = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/tasks/`;
      
      // Always apply a date filter - use selectedDate or today (local timezone)
      const targetDate = dateFilter || getLocalToday();
      const nextDay = addDaysToDateString(targetDate, 1);
      url += `?start_date=${targetDate}&end_date=${nextDay}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Failed to load tasks from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const newTasks = Array.isArray(tasks) ? [...tasks, createdTask] : [createdTask];
      setTasks(newTasks);
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
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? updatedTaskFromServer : task
      );
      setTasks(updatedTasks);
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

      const filteredTasks = tasks.filter(task => task.id !== taskId);
      setTasks(filteredTasks);
    } catch (error) {
      setError('Failed to delete task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  // Load tasks when selectedDate changes
  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate, loadTasks]);

  // Sort tasks by date
  const sortedTasks = Array.isArray(tasks) ? tasks.sort((a, b) => new Date(b.date_worked) - new Date(a.date_worked)) : [];

  return {
    tasks: sortedTasks,
    isLoading,
    error,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    setError
  };
};