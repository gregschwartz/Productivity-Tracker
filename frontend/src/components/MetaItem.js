import React from 'react';
import styled from 'styled-components';

/**
 * Flexible meta item component for displaying small pieces of information with icons
 */
const StyledMetaItem = styled.div.attrs((props) => ({
  className: `flex items-center gap-${props.gap || '1.5'} text-${props.size || 'sm'}`
}))`
  color: ${props => props.theme.colors.text.muted};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
  `}

  svg {
    width: ${props => props.$iconSize || '14px'};
    height: ${props => props.$iconSize || '14px'};
    flex-shrink: 0;
  }
`;

/**
 * Reusable meta item component for displaying information with icons
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display
 * @param {string} props.size - Text size ('xs', 'sm', 'base', etc.)
 * @param {string} props.gap - Gap between icon and text ('1', '1.5', '2', etc.)
 * @param {string} props.iconSize - Size of icons in pixels ('12px', '14px', '16px', etc.)
 * @param {string} props.className - Additional CSS classes
 */
function MetaItem({ 
  children, 
  size = 'sm', 
  gap = '1.5', 
  iconSize = '14px',
  className = '',
  ...props 
}) {
  return (
    <StyledMetaItem 
      size={size}
      gap={gap}
      $iconSize={iconSize}
      className={className}
      {...props}
    >
      {children}
    </StyledMetaItem>
  );
}

export default MetaItem; 