import React, { useState, useEffect } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';
import ProductivityTracker from './pages/ProductivityTracker';
import { themes } from './themes/themes';


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
// TRON mode states enum
const TRON_STATE = {
  NEVER_TURNED_ON: 'never_turned_on',
  TURNED_ON: 'turned_on', 
  TURNED_OFF: 'turned_off'
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tronState, setTronState] = useState(TRON_STATE.NEVER_TURNED_ON);
  const [tasks, setTasks] = useState([]);

  // Load tasks from backend on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('productivity-tasks');    
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }

    const detectSystemTheme = () => {
      try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (error) {
        console.warn('Could not detect system dark mode preference:', error);
        return false;
      }
    };
    
    setIsDarkMode(detectSystemTheme());

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Always follow system preference
      setIsDarkMode(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
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

  useEffect(() => {
    // Check if any task should trigger TRON theme, only enable if state is NEVER_TURNED_ON
    if (tronState === TRON_STATE.NEVER_TURNED_ON && shouldUseTronTheme(tasks)) {
      setTronState(TRON_STATE.TURNED_ON);
    }
  }, [tasks, tronState]);

  // Determine which theme to use
  const getActiveTheme = () => {
    if (tronState === TRON_STATE.TURNED_ON) {
      return themes.Tron;
    }
    return isDarkMode ? themes['Ready-Dark'] : themes.Ready;
  };

  const activeTheme = getActiveTheme();

  // Set theme data attribute on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme.name);
  }, [activeTheme]);

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = (event) => {
    if (tronState === TRON_STATE.TURNED_ON) {
      setTronState(TRON_STATE.TURNED_OFF);
    } else {
      setIsDarkMode(!isDarkMode);
    }
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      <div data-testid="app-container" data-theme={activeTheme}>
        <Router>
          <ProductivityTracker 
            isDarkMode={isDarkMode}
            onThemeToggle={handleThemeToggle}
          />
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App; 