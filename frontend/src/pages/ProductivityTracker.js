import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import TaskManager from './TaskManager';
import Visualizations from './Visualizations';
import SearchAgent from './SearchAgent';
import Navigation from '../components/Navigation';
import PageHeader from '../components/PageHeader';
import { BarChart3, Calendar, Search } from 'lucide-react';
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
function ProductivityTracker({ isDarkMode, onThemeToggle, onTasksUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const theme = useTheme();
  let currentTheme = theme.name || 'Ready';
  
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
        case 'visualizations':
          return `Visualizations | ${baseTitle}`;
        case 'search':
          return `Search | ${baseTitle}`;
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



  const navigationItems = [
    { key: 'tasks', label: 'Tasks', icon: Calendar },
    { key: 'visualizations', label: 'Visualizations', icon: BarChart3 },
    { key: 'search', label: 'Search', icon: Search },
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
            selectedDate={selectedDate}
            onDateChange={handleNavigateToDate}
            onClearDateFilter={handleClearDateFilter}
            onTasksUpdate={onTasksUpdate}
          />
        );
      case 'visualizations':
        return <Visualizations onNavigateToDate={handleNavigateToDate} onAddSummary={(summary) => {}} />;
      case 'search':
        return <SearchAgent />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'tasks': return 'Daily Task Tracker';
      case 'visualizations': return 'Visualizations & Summaries';
      case 'search': return 'Historical Search';
      default: return 'Productivity Tracker';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'tasks': return 'Track your work to understand your patterns.';
      case 'visualizations': return 'Task visualizations and AI recommendations';
      case 'search': return 'Search through your productivity history to find similar patterns and insights.';
      default: return 'Your personal productivity intelligence platform.';
    }
  };


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