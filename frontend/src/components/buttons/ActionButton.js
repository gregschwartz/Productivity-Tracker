import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Primary action button styled component
 */
const StyledActionButton = styled(motion.button).attrs(props => ({
  className: `
    flex items-center justify-center gap-2 px-6 py-3 rounded-lg
    font-medium text-sm transition-all duration-200 cursor-pointer
    focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
    disabled:transform-none border-none
    ${props.$variant === 'primary' 
      ? 'bg-primary text-primary-text hover:-translate-y-0.5 hover:shadow-lg' 
      : props.$variant === 'secondary'
      ? 'bg-transparent text-text-secondary border border-border hover:bg-background-hover hover:border-primary hover:text-primary'
      : 'bg-background-hover text-text-secondary hover:bg-primary hover:text-primary-text'
    }
    ${props.$theme === 'tron' && props.$variant === 'primary' 
      ? 'border border-primary glow-sm uppercase tracking-wide font-mono hover:glow-md' 
      : props.$theme === 'tron' && props.$variant === 'secondary'
      ? 'border-border text-text-primary uppercase tracking-wide font-mono hover:glow-sm'
      : ''
    }
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:focus {
    box-shadow: 0 0 0 3px var(--color-primary);
  }
`;

/**
 * Reusable ActionButton component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'ghost'
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {React.ReactNode} props.icon - Optional icon
 * @param {string} props.className - Additional CSS classes
 */
function ActionButton({ 
  children, 
  onClick = () => {}, 
  disabled = false, 
  variant = 'primary',
  loading = false,
  icon,
  className = "",
  ...props 
}) {
  // Get current theme name from data attribute
  const [currentTheme, setCurrentTheme] = React.useState('Ready');
  
  React.useEffect(() => {
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

  return (
    <StyledActionButton
      onClick={onClick}
      disabled={disabled || loading}
      $variant={variant}
      $theme={currentTheme}
      className={className}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      animate={loading ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
      transition={loading ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }}
      {...props}
    >
      {icon && icon}
      {children}
    </StyledActionButton>
  );
}

export default ActionButton; 