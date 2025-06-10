import React from 'react';
import styled from 'styled-components';
import { Moon, Sun } from 'lucide-react';

/**
 * Navigation bar styled component
 */
const NavigationContainer = styled.nav`
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
 * Tron logo styled component
 */
const TronLogo = styled.img.attrs({
  className: 'h-12 transition-all duration-200 hover:glow-md'
})`
  aspect-ratio: 5.106382979;
`;

/**
 * Reusable Navigation component
 * @param {Object} props - Component props
 * @param {Array} props.items - Navigation items with { key, label, icon }
 * @param {string} props.activeItem - Currently active item key
 * @param {function} props.onItemClick - Callback when nav item is clicked
 * @param {boolean} props.isDarkMode - Whether dark mode is active
 * @param {string} props.currentTheme - Current theme name
 * @param {function} props.onThemeToggle - Theme toggle callback
 * @param {string} props.className - Additional CSS classes
 */
function Navigation({ 
  items = [], 
  activeItem, 
  onItemClick = () => {}, 
  isDarkMode = false,
  currentTheme = 'Ready',
  onThemeToggle = () => {},
  className = ""
}) {
  return (
    <NavigationContainer className={`bg-surface rounded-xl shadow-theme-md border border-border ${className}`}>
      {items.map(({ key, label, icon: Icon }) => (
        <NavButton
          key={key}
          $active={activeItem === key}
          $theme={currentTheme}
          onClick={() => onItemClick(key)}
        >
          <Icon />
          {label}
        </NavButton>
      ))}
      <NavButton
        onClick={onThemeToggle}
        title={currentTheme === 'Tron' ? 'Exit TRON Mode' : (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')}
        $theme={currentTheme}
      >
        {currentTheme === 'Tron' ? (
          <TronLogo src="/tron-light-cycle.gif" alt="Theme: TRON" />
        ) : (
          isDarkMode ? <Sun /> : <Moon />
        )}
      </NavButton>
    </NavigationContainer>
  );
}

export default Navigation; 