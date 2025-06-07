import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
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
  background: ${props => props.theme.colors.background};
  padding: 20px;
`;

/**
 * Navigation bar styled component
 */
const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 12px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: ${props => props.theme.name === 'Tron' ? `1px solid ${props.theme.colors.border}` : `1px solid ${props.theme.colors.border}`};
  
  ${props => props.theme.name === 'Tron' && `
    box-shadow: ${props.theme.shadows.medium};
    background: ${props.theme.colors.surface};
  `}
`;

/**
 * Navigation button styled component
 */
const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  margin: 0 4px;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.primaryText : props.theme.colors.text.secondary};
  border: ${props => props.theme.name === 'Tron' && props.$active ? `1px solid ${props.theme.colors.primary}` : 'none'};
  
  ${props => props.theme.name === 'Tron' && `
    text-shadow: ${props.$active ? props.theme.glow.small : 'none'};
    box-shadow: ${props.$active ? props.theme.glow.small : 'none'};
  `}

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    transform: translateY(-1px);
    
    ${props => props.theme.name === 'Tron' && !props.$active && `
      color: ${props.theme.colors.primary};
      text-shadow: ${props.theme.glow.small};
    `}
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

/**
 * Content area styled component
 */
const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

/**
 * Page header styled component
 */
const PageHeader = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

/**
 * Page title styled component
 */
const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
  
  ${props => props.theme.name === 'Tron' && `
    color: ${props.theme.colors.primary};
    text-shadow: ${props.theme.glow.medium};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 2px;
  `}
`;

/**
 * Page subtitle styled component
 */
const PageSubtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TronLogo = styled.img`
  aspect-ratio: 5.106382979;
  height: 50px;
  transition: all 0.2s ease;
  
  ${props => `
    drop-shadow: ${props.theme.glow.small};
    
    &:hover {
      drop-shadow: ${props.theme.glow.medium};
    }
  `}
`;

/**
 * Main ProductivityTracker component that orchestrates all functionality
 */
function ProductivityTracker({ isDarkMode, onThemeToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  
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
    <Container>
      <Navigation>
        {navigationItems.map(({ key, label, icon: Icon }) => (
          <NavButton
            key={key}
            $active={activeTab === key}
            onClick={() => navigateToTab(key)}
          >
            <Icon />
            {label}
          </NavButton>
        ))}
        <NavButton
          onClick={onThemeToggle}
          title={theme.name === 'Tron' ? 'Exit TRON Mode' : (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode (Shift+Click for TRON)')}
        >
          {theme.name === 'Tron' ? (
            <TronLogo src="/tron-light-cycle.gif" alt="Theme: TRON" />
          ) : (
            isDarkMode ? <Sun /> : <Moon />
          )}
        </NavButton>
      </Navigation>

      <Content>
        <PageHeader>
          <PageTitle>{getPageTitle()}</PageTitle>
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