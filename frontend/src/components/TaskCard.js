import styled from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Task card component
 */
const TaskCard = styled(motion.div).attrs(props => ({
  className: `
    rounded-lg p-5 shadow-theme-sm transition-all duration-200 border
    hover:-translate-y-0.5 hover:shadow-theme-md
    ${props.$isEditing ? 'border-primary shadow-[0_0_0_2px_rgb(var(--color-primary)/0.2)]' : 'border-border'}
    ${props.$theme === 'Tron' 
      ? `border-border hover:border-primary ${props.$isEditing ? 'glow-md' : ''}` 
      : ''
    }
  `
}))`
  ${props => {
    const focusColors = {
      low: 'var(--color-focus-low)',
      medium: 'var(--color-focus-medium)',
      high: 'var(--color-focus-high)'
    };
    
    return `background: ${focusColors[props.$focusLevel] || 'var(--color-surface)'};`;
  }}
`;

export default TaskCard; 