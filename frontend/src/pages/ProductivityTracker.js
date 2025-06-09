import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import TaskManager from './TaskManager';
import Visualizations from './Visualizations';
import SearchAgent from './SearchAgent';
import AdminDashboard from './AdminDashboard';
import Navigation from '../components/Navigation';
import PageHeader from '../components/PageHeader';
import { BarChart3, Calendar, Search, Settings } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useTheme } from 'styled-components';

/**
 * Main container for the productivity tracker application
 */
const Container = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

/**
 * Content area styled component
 */
const Content = styled.div.attrs({
  className: 'max-w-6xl mx-auto'
})``;

/**
 * Main ProductivityTracker component that orchestrates all functionality
 */
function ProductivityTracker({ isDarkMode, onThemeToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const theme = useTheme();
  let currentTheme = theme.name || 'Ready';
  
  const [tasks, setTasks] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Get active tab from URL path
   * @returns {string} The active tab
   */
  const getActiveTabFromPath = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    return path || 'tasks';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Get selected date from URL parameters
  const selectedDate = searchParams.get('date');

  // Update document title based on active tab and date
  useEffect(() => {
    const getDocumentTitle = () => {
      const baseTitle = 'Productivity Tracker';
      switch (activeTab) {
        case 'tasks':
          if (selectedDate) {
            return `Tasks - ${selectedDate} | ${baseTitle}`;
          }
          return `Tasks | ${baseTitle}`;
        case 'analytics':
          return `Analytics | ${baseTitle}`;
        case 'search':
          return `Search | ${baseTitle}`;
        case 'admin':
          return `Admin | ${baseTitle}`;
        default:
          return baseTitle;
      }
    };
    
    document.title = getDocumentTitle();
  }, [activeTab, selectedDate]);

  // Update active tab when URL changes
  useEffect(() => {
    const path = location.pathname.substring(1);
    const tabFromPath = path || 'tasks';
    setActiveTab(tabFromPath);
  }, [location.pathname]);

  /**
   * Load tasks from the backend API
   */
  const loadTasks = async () => {
    try {
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/tasks/`;
      
      if (selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        url += `?start_date=${selectedDate}&end_date=${nextDay.toISOString().split('T')[0]}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
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
      console.error('Error loading summaries:', error);
      setError('Failed to load summaries from server.');
    }
  };

  /**
   * Load data from backend API on component mount
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadTasks(),
        loadSummaries()
      ]);
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  /**
   * Add a new task to the backend and local state
   */
  const addTask = async (task, targetDate = null) => {
    let dateToUse;
    if (task.date_worked && task.date_worked.includes('T')) {
      // Already a full datetime string
      dateToUse = task.date;
    } else {
      dateToUse = targetDate || task.date_worked || selectedDate || new Date().toISOString().split('T')[0];
    }
    const newTask = {
      ...task,
      date: dateToUse,
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
      setTasks(prev => [...prev, createdTask]);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to save task to server. Please try again.');
      // Don't clear the form - let the user retry
      throw error; // Re-throw so TaskManager knows the operation failed
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
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTaskFromServer : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
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

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Add a new summary (this will be saved via the backend in WeekSummary component)
   */
  const addSummary = (summary) => {
    setSummaries(prev => [...prev, summary]);
  };

  const navigationItems = [
    { key: 'tasks', label: 'Tasks', icon: Calendar },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'search', label: 'Search', icon: Search },
    { key: 'admin', label: 'Admin', icon: Settings }
  ];

  /**
   * Navigate to a specific tab
   */
  const navigateToTab = (tab) => {
    if (tab === 'tasks' && selectedDate) {
      navigate(`/${tab}?date=${selectedDate}`);
    } else {
      navigate(`/${tab}`);
    }
  };

  /**
   * Navigate to tasks view with specific date filter
   */
  const handleNavigateToDate = (date) => {
    navigate(`/tasks?date=${date}`);
  };

  /**
   * Clear date filter and return to today's tasks
   */
  const handleClearDateFilter = () => {
    navigate('/tasks');
  };

  /**
   * Render active tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TaskManager
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            selectedDate={selectedDate}
            onDateChange={handleNavigateToDate}
            onClearDateFilter={handleClearDateFilter}
            isLoading={loading}
          />
        );
      case 'analytics':
        return <Visualizations tasks={tasks} summaries={summaries} onNavigateToDate={handleNavigateToDate} onAddSummary={addSummary} isLoading={loading} />;
      case 'search':
        return <SearchAgent summaries={summaries} />;
      case 'admin':
        return <AdminDashboard tasks={tasks} summaries={summaries} />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'tasks': return 'Daily Task Tracker';
      case 'analytics': return 'Analytics & Summaries';
      case 'search': return 'Historical Search';
      case 'admin': return 'Admin Dashboard';
      default: return 'Productivity Tracker';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'tasks': return 'Track your work to understand your patterns.';
      case 'analytics': return 'Task analytics and AI recommendations';
      case 'search': return 'Search through your productivity history to find similar patterns and insights.';
      case 'admin': return 'Configure integrations, monitor system health, and manage your data.';
      default: return 'Your personal productivity intelligence platform.';
    }
  };

  if (loading) {
    return (
      <Container className="bg-background">
        <Navigation
          items={navigationItems}
          activeItem={activeTab}
          onItemClick={navigateToTab}
          isDarkMode={isDarkMode}
          currentTheme={currentTheme}
          onThemeToggle={onThemeToggle}
        />
        <Content>
          <div className="flex justify-center items-center min-h-64">
            <div className="text-text-secondary">Loading productivity data...</div>
          </div>
        </Content>
      </Container>
    );
  }

  return (
    <Container className="bg-background">
      <Navigation
        items={navigationItems}
        activeItem={activeTab}
        onItemClick={navigateToTab}
        isDarkMode={isDarkMode}
        currentTheme={currentTheme}
        onThemeToggle={onThemeToggle}
      />

      <Content>
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          currentTheme={currentTheme}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-800 dark:text-red-200 text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </Content>
    </Container>
  );
}

export default ProductivityTracker; 