import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import ProductivityTracker from './components/ProductivityTracker';
import { themes } from './themes/themes';
import { loadSampleDataIfEmpty } from './utils/sampleData';

/**
 * Global styles that apply to all design themes
 */
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
  }
`;



/**
 * Easter Egg Helper function to check if any task triggers Tron theme
 * Checks for: "for the user", "Master Control Program", "mcp", "Kevin" (case insensitive)
 */
const shouldUseTronTheme = (tasks) => {
  const tronKeywords = ['for the user', 'master control program', 'mcp', 'kevin'];
  
  return tasks.some(task => {
    const taskName = (task.name || '').toLowerCase();
    return tronKeywords.some(keyword => taskName.includes(keyword));
  });
};

/**
 * Main App component
 */
function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [inputMatchesEasterEgg, setInputMatchesEasterEgg] = useState(false);

  // Load dark mode preference and tasks from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('productivity-dark-mode');
    const savedTasks = localStorage.getItem('productivity-tasks');
    
    // Detect system dark mode preference with proper error handling
    let systemPrefersDark = false;
    try {
      systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('Could not detect system dark mode preference:', error);
    }
    
    // Use saved preference, or fall back to system preference
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      setIsDarkMode(systemPrefersDark);
    }

    // Load tasks for theme detection
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }

    // Load sample data if needed
    loadSampleDataIfEmpty();
  }, []);

  // Listen for tasks changes (from localStorage updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTasks = localStorage.getItem('productivity-tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for tasks changes
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Save dark mode preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('productivity-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Handler for live task input changes
  const handleTaskInputChange = (inputValue) => {
    const tronKeywords = ['for the user', 'master control program', 'mcp', 'kevin'];
    const matchesEasterEgg = tronKeywords.some(keyword => (inputValue || '').toLowerCase().includes(keyword));
    setInputMatchesEasterEgg(matchesEasterEgg);
  };

  // Determine which theme to use
  const getActiveTheme = () => {
    // If input matches Easter Egg, force Tron theme
    if (inputMatchesEasterEgg) {
      return themes.Tron;
    }
    // Check if any task should trigger Tron theme
    if (shouldUseTronTheme(tasks)) {
      return themes.Tron;
    }
    // Otherwise use Ready/Ready-Dark theme based on user preference
    return isDarkMode ? themes['Ready-Dark'] : themes.Ready;
  };

  const activeTheme = getActiveTheme();

  /**
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      <Router>
      <ProductivityTracker 
        onTaskInputChange={handleTaskInputChange}
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
      />
      </Router>
    </ThemeProvider>
  );
}

export default App; 