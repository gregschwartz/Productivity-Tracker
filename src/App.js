import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
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
 * Styled container for the theme selector
 */
const ThemeSelector = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => props.theme.colors.surface};
  padding: 12px;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
`;

/**
 * Theme toggle button container
 */
const ThemeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

/**
 * Dark mode toggle button
 */
const DarkModeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primaryText};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Individual theme button
 */
const ThemeButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.active ? props.theme.colors.primaryText : props.theme.colors.text.primary};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  transition: all 0.2s ease;
  min-width: 80px;

  &:hover {
    background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    transform: translateY(-1px);
  }
`;

/**
 * Theme grid container
 */
const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

/**
 * Helper function to get the base theme name (without -dark or -light suffix)
 */
const getBaseThemeName = (themeName) => {
  return themeName.replace('-dark', '').replace('-light', '');
};

/**
 * Helper function to get the dark/light variant of a theme
 */
const getThemeVariant = (baseTheme, isDark) => {
  if (baseTheme === 'tron') {
    return isDark ? 'tron' : 'tron-light';
  }
  return isDark ? `${baseTheme}-dark` : baseTheme;
};

/**
 * Main App component
 */
function App() {
  const [currentTheme, setCurrentTheme] = useState('elegant');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme and dark mode preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('productivity-theme');
    const savedDarkMode = localStorage.getItem('productivity-dark-mode');
    
    // Detect system dark mode preference
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme && themes[savedTheme]) {
      const baseTheme = getBaseThemeName(savedTheme);
      setCurrentTheme(baseTheme);
      setIsDarkMode(savedTheme.includes('-dark') || (savedTheme === 'tron' && !savedTheme.includes('-light')));
    }
    
    // Use saved preference, or fall back to system preference
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      setIsDarkMode(systemPrefersDark);
    }

    // Load sample data if needed
    loadSampleDataIfEmpty();
  }, []);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    const actualTheme = getThemeVariant(currentTheme, isDarkMode);
    localStorage.setItem('productivity-theme', actualTheme);
    localStorage.setItem('productivity-dark-mode', isDarkMode.toString());
  }, [currentTheme, isDarkMode]);

  // Get the actual theme object to use
  const actualTheme = getThemeVariant(currentTheme, isDarkMode);
  const theme = themes[actualTheme] || themes.elegant;

  // Get available base themes (without dark/light variants)
  const baseThemes = ['elegant', 'ready', 'readyAlt', 'tron'];

  /**
   * Handle theme change
   */
  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
  };

  /**
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ThemeSelector>
        <ThemeControls>
          <DarkModeToggle onClick={handleDarkModeToggle}>
            {isDarkMode ? <Sun /> : <Moon />}
            {isDarkMode ? 'Light' : 'Dark'}
          </DarkModeToggle>
        </ThemeControls>
        <ThemeGrid>
          {baseThemes.map((themeName) => (
            <ThemeButton
              key={themeName}
              active={currentTheme === themeName}
              onClick={() => handleThemeChange(themeName)}
            >
              {themeName === 'readyAlt' ? 'Ready Alt' : themeName}
            </ThemeButton>
          ))}
        </ThemeGrid>
      </ThemeSelector>
      <ProductivityTracker />
    </ThemeProvider>
  );
}

export default App; 