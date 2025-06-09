import React from 'react';
import styled, { useTheme } from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Focus selector container
 */
const FocusSelectorContainer = styled.div.attrs(props => ({
  className: `
    flex border border-border rounded-full overflow-hidden bg-background
    ${props.$theme === 'tron' ? 'border-primary' : ''}
  `
}))``;

/**
 * Individual focus level chip
 */
const FocusChip = styled(motion.button).attrs(props => ({
  className: `
    px-4 py-3 border-none text-sm font-medium capitalize tracking-wide 
    transition-all duration-200 flex-1 relative h-11 flex items-center justify-center
    border-r border-border last:border-r-0
    ${props.$theme === 'tron' ? 'border-r-primary' : ''}
  `
}))`
  ${props => {
    const focusColors = {
      low: props.theme.colors.focus.low,
      medium: props.theme.colors.focus.medium, 
      high: props.theme.colors.primary
    };
    
    const focusTextColors = {
      low: props.theme.colors.text.primary,
      medium: props.theme.colors.text.primary,
      high: props.theme.colors.primaryText
    };
    
    const color = focusColors[props.$level];
    const textColor = focusTextColors[props.$level];
    const hoverBg = props.theme.colors.backgroundHover;
    
    // Base styles
    let baseStyle = `
      color: ${props.theme.colors.text.secondary};
      &:hover {
        background: ${hoverBg};
        color: ${props.theme.colors.primary};
      }
    `;

    if (props.$selected) {
      baseStyle = `
        background: ${color};
        color: ${textColor};
        font-weight: 600;
        ${props.$theme === 'tron' ? 'box-shadow: inset 0 0 5px currentColor;' : ''}
        ${props.$theme === 'tron' ? 'color: #000000 !important;' : ''}
      `;
    }
    return baseStyle;
  }}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-primary);
    z-index: 1;
    position: relative;
  }
`;

/**
 * Reusable FocusSelector component
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected focus level
 * @param {function} props.onChange - Change handler
 * @param {Array<string>} props.levels - Available focus levels
 * @param {string} props.className - Additional CSS classes
 */
function FocusSelector({ 
  value = 'medium', 
  onChange = () => {}, 
  levels = ['low', 'medium', 'high'],
  className = "",
  ...props 
}) {
  const theme = useTheme();
  let currentTheme = theme.name || 'Ready';

  /**
   * Handle keyboard navigation for focus level pills
   */
  const handleKeyDown = (e, currentLevel) => {
    const currentIndex = levels.indexOf(currentLevel);
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = currentIndex > 0 ? currentIndex - 1 : levels.length - 1;
      const newLevel = levels[newIndex];
      onChange(newLevel);
      // Focus the new button
      setTimeout(() => {
        const newButton = document.querySelector(`button[data-level="${newLevel}"]`);
        if (newButton) newButton.focus();
      }, 0);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = currentIndex < levels.length - 1 ? currentIndex + 1 : 0;
      const newLevel = levels[newIndex];
      onChange(newLevel);
      // Focus the new button
      setTimeout(() => {
        const newButton = document.querySelector(`button[data-level="${newLevel}"]`);
        if (newButton) newButton.focus();
      }, 0);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(currentLevel);
    }
  };

  return (
    <FocusSelectorContainer $theme={currentTheme} className={className} {...props}>
      {levels.map((level, index) => (
        <FocusChip
          key={level}
          type="button"
          $level={level}
          $selected={value === level}
          $theme={currentTheme}
          onClick={() => onChange(level)}
          onKeyDown={(e) => handleKeyDown(e, level)}
          tabIndex={value === level ? 0 : -1}
          aria-pressed={value === level}
          data-level={level}
          whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
          animate={value === level ? { scale: [1, 1.05, 1], transition: { duration: 0.3 } } : { scale: 1 }}
        >
          {level}
        </FocusChip>
      ))}
    </FocusSelectorContainer>
  );
}

export default FocusSelector; 