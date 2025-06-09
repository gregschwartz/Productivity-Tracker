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

// Removed - now using imported Navigation and PageHeader components

/**
 * Main ProductivityTracker component that orchestrates all functionality
 */
function ProductivityTracker({ isDarkMode, onThemeToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get current theme name from data attribute
  const [currentTheme, setCurrentTheme] = useState('Ready');
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const themeName = document.documentElement.getAttribute('data-theme');
      if (themeName) setCurrentTheme(themeName);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // Set initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme');
    if (initialTheme) setCurrentTheme(initialTheme);
    
    return () => observer.disconnect();
  }, []);
  
  const [tasks, setTasks] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get active tab from URL path
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
   * Load tasks from backend API
   */
  const loadTasks = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const tasksData = await response.json();
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks from server');
      // Fallback to localStorage if backend fails
      const savedTasks = localStorage.getItem('productivity-tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (parseError) {
          console.error('Error parsing localStorage tasks:', parseError);
        }
      }
    }
  };

  /**
   * Load summaries from backend API
   */
  const loadSummaries = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/summaries/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch summaries: ${response.status} ${response.statusText}`);
      }
      
      const summariesData = await response.json();
      setSummaries(summariesData || []);
    } catch (error) {
      console.error('Error loading summaries:', error);
      setError(prevError => prevError ? `${prevError}; Failed to load summaries` : 'Failed to load summaries from server');
      // Fallback to localStorage if backend fails
      const savedSummaries = localStorage.getItem('weekly-summaries');
      if (savedSummaries) {
        try {
          setSummaries(JSON.parse(savedSummaries));
        } catch (parseError) {
          console.error('Error parsing localStorage summaries:', parseError);
        }
      }
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
   * Add a new task to the backend and update local state
   */
  const addTask = async (task, targetDate = null) => {
    const dateToUse = targetDate || selectedDate || new Date().toISOString().split('T')[0];
    const newTask = {
      ...task,
      date: dateToUse,
      timestamp: new Date().toISOString()
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
      
      // Also save to localStorage as backup
      localStorage.setItem('productivity-tasks', JSON.stringify([...tasks, createdTask]));
    } catch (error) {
      console.error('Error adding task:', error);
      // Fallback to local state and localStorage
      const taskWithTempId = {
        ...newTask,
        id: Date.now() + Math.random()
      };
      setTasks(prev => [...prev, taskWithTempId]);
      localStorage.setItem('productivity-tasks', JSON.stringify([...tasks, taskWithTempId]));
      setError('Task saved locally. Server sync failed - will retry later.');
    }
  };

  /**
   * Update an existing task in the backend and local state
   */
  const updateTask = async (taskId, updatedTask) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
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
      
      // Update localStorage backup
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? updatedTaskFromServer : task
      );
      localStorage.setItem('productivity-tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error updating task:', error);
      // Fallback to local state update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      );
      localStorage.setItem('productivity-tasks', JSON.stringify(updatedTasks));
      setError('Task updated locally. Server sync failed - will retry later.');
    }
  };

  /**
   * Delete a task from the backend and local state
   */
  const deleteTask = async (taskId) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Update localStorage backup
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      localStorage.setItem('productivity-tasks', JSON.stringify(filteredTasks));
    } catch (error) {
      console.error('Error deleting task:', error);
      // Fallback to local state update
      setTasks(prev => prev.filter(task => task.id !== taskId));
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      localStorage.setItem('productivity-tasks', JSON.stringify(filteredTasks));
      setError('Task deleted locally. Server sync failed - will retry later.');
    }
  };

  /**
   * Add a new summary (this will be saved via the backend in WeekSummary component)
   */
  const addSummary = (summary) => {
    setSummaries(prev => [...prev, summary]);
    // Also save to localStorage as backup
    localStorage.setItem('weekly-summaries', JSON.stringify([...summaries, summary]));
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
          />
        );
      case 'analytics':
        return <Visualizations tasks={tasks} summaries={summaries} onNavigateToDate={handleNavigateToDate} onAddSummary={addSummary} />;
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