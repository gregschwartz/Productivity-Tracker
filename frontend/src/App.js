import React, { useState, useEffect, Component } from 'react';
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
 * Error Boundary for graceful error handling
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>An error occurred while loading the application.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const [tasksCount, setTasksCount] = useState(0);

  // Load initial tasks count for the navbar (simplified)
  useEffect(() => {
    const loadTasksCount = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api' 
          : '/api';
        
        const response = await fetch(`${apiUrl}/tasks/stats/count/`);
        if (response.ok) {
          const data = await response.json();
          setTasksCount(data.total_tasks || 0);
        } else {
          console.error("Failed to load tasks count:", response.statusText);
        }
      } catch (error) {
        console.error('Error loading tasks count:', error);
        setTasksCount(0);
      }
    };

    loadTasksCount();
  }, []);

  // Listen for tasks changes (from API updates)
  useEffect(() => {
    const handleTasksUpdate = () => {
      // Re-fetch count when tasks are updated
      const loadTasksCount = async () => {
        try {
          const apiUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:8000/api' 
            : '/api';
          
          const response = await fetch(`${apiUrl}/tasks/stats/count/`);
          if (response.ok) {
            const data = await response.json();
            setTasksCount(data.total_tasks || 0);
          }
        } catch (error) {
          console.error('Error loading tasks count:', error);
        }
      };
      loadTasksCount();
    };

    // Listen for custom events or implement your own task update tracking
    window.addEventListener('tasksUpdated', handleTasksUpdate);
    return () => window.removeEventListener('tasksUpdated', handleTasksUpdate);
  }, []);

  // Initialize theme from system preference
  useEffect(() => {
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
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Always follow system preference
      setIsDarkMode(e.matches);
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (mediaQuery?.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // TRON theme checking is now handled at component level where tasks are loaded

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
    <ErrorBoundary>
      <ThemeProvider theme={activeTheme}>
        <GlobalStyle />
        <div data-testid="app-container" data-theme={activeTheme.name}>
          <Router>
            <ErrorBoundary>
              <ProductivityTracker 
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                tasksCount={tasksCount}
              />
            </ErrorBoundary>
          </Router>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 