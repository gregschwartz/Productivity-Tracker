import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import TaskManager from './TaskManager';
import Visualizations from './Visualizations';
import SearchAgent from './SearchAgent';
import AdminDashboard from './AdminDashboard';
import { loadSampleDataIfEmpty } from '../utils/sampleData';
import { BarChart3, Calendar, Search, Settings, Moon, Sun } from 'lucide-react';

/**
 * Main container for the productivity tracker application
 */
const Container = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

/**
 * Navigation bar styled component
 */
const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  padding: 12px;
`;

/**
 * Navigation button styled component
 */
const NavButton = styled.button.attrs(props => ({
  className: `
  flex items-center gap-2 px-5 py-3 mx-1 rounded-lg font-medium text-sm
  transition-all duration-200 hover:-translate-y-0.5 border
  shadow-md hover:shadow-lg active:translate-y-0
    ${props.$active 
      ? 'bg-primary text-primary-text border-primary' 
      : 'bg-transparent text-text-secondary hover:bg-background-hover hover:text-primary hover:border-primary/50 border-border'
    }
    ${props.$theme === 'Tron' && props.$active ? 'border-primary glow-sm' : ''}
  `
}))`
  svg {
    width: 18px;
    height: 18px;
  }
`;

/**
 * Content area styled component
 */
const Content = styled.div.attrs({
  className: 'max-w-6xl mx-auto'
})``;

/**
 * Page header styled component
 */
const PageHeader = styled.div.attrs({
  className: 'mb-8 text-center'
})``;

/**
 * Page title styled component
 */
const PageTitle = styled.h1.attrs(props => ({
  className: `
    text-4xl font-bold text-text-primary mb-2
    ${props.$theme === 'Tron' ? 'text-primary text-glow font-mono uppercase tracking-wider' : ''}
  `
}))``;

/**
 * Page subtitle styled component
 */
const PageSubtitle = styled.p.attrs({
  className: 'text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed'
})``;

const TronLogo = styled.img.attrs({
  className: 'h-12 transition-all duration-200 hover:glow-md'
})`
  aspect-ratio: 5.106382979;
`;

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
   * Load data from localStorage on component mount
   */
  useEffect(() => {
    // Load sample data if no data exists
    loadSampleDataIfEmpty();

    const savedTasks = localStorage.getItem('productivity-tasks');
    const savedSummaries = localStorage.getItem('weekly-summaries');
    
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
    
    if (savedSummaries) {
      try {
        setSummaries(JSON.parse(savedSummaries));
      } catch (error) {
        console.error('Error loading summaries:', error);
      }
    }
  }, []);

  /**
   * Save tasks to localStorage whenever tasks change
   */
  useEffect(() => {
    localStorage.setItem('productivity-tasks', JSON.stringify(tasks));
  }, [tasks]);

  /**
   * Save summaries to localStorage whenever summaries change
   */
  useEffect(() => {
    localStorage.setItem('weekly-summaries', JSON.stringify(summaries));
  }, [summaries]);

  /**
   * Add a new task to the task list
   */
  const addTask = (task, targetDate = null) => {
    const dateToUse = targetDate || selectedDate || new Date().toISOString().split('T')[0];
    const newTask = {
      ...task,
      id: Date.now() + Math.random(),
      date: dateToUse,
      timestamp: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
  };

  /**
   * Update an existing task
   */
  const updateTask = (taskId, updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updatedTask } : task
    ));
  };

  /**
   * Delete a task
   */
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  /**
   * Add a new summary to the summaries list
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

  return (
    <Container className="bg-background">
      <Navigation className="bg-surface rounded-xl shadow-theme-md border border-border">
        {navigationItems.map(({ key, label, icon: Icon }) => (
          <NavButton
            key={key}
            $active={activeTab === key}
            $theme={currentTheme}
            onClick={() => navigateToTab(key)}
          >
            <Icon />
            {label}
          </NavButton>
        ))}
        <NavButton
          onClick={onThemeToggle}
          title={currentTheme === 'Tron' ? 'Exit TRON Mode' : (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode (Shift+Click for TRON)')}
          $theme={currentTheme}
        >
          {currentTheme === 'Tron' ? (
            <TronLogo src="/tron-light-cycle.gif" alt="Theme: TRON" />
          ) : (
            isDarkMode ? <Sun /> : <Moon />
          )}
        </NavButton>
      </Navigation>

      <Content>
        <PageHeader>
          <PageTitle $theme={currentTheme}>{getPageTitle()}</PageTitle>
          <PageSubtitle>{getPageSubtitle()}</PageSubtitle>
        </PageHeader>

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