import React from 'react';
import styled from 'styled-components';

/**
 * Empty state styled component for consistent empty states across the app
 */
const EmptyStateContainer = styled.div.attrs(() => ({
  className: 'text-center py-15 px-5'
}))`
  color: ${props => props.theme.colors.text.muted};
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text.secondary};
    
    ${props => props.theme.name === 'tron' && `
      color: ${props.theme.colors.primary};
      font-family: ${props.theme.fonts.mono};
      text-transform: uppercase;
      letter-spacing: 1px;
    `}
  }
  
  p {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

/**
 * Icon container for empty state
 */
const IconContainer = styled.div`
  margin-bottom: 16px;
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    color: ${props => props.theme.colors.text.muted};
    
    ${props => props.theme.name === 'tron' && `
      color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Reusable EmptyState component
 * @param {Object} props - Component props
 * @param {string} props.title - Title for the empty state
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.icon - Optional icon component
 * @param {React.ReactNode} props.children - Optional children (e.g., action buttons)
 */
function EmptyState({ title, description, icon, children }) {
  return (
    <EmptyStateContainer>
      {icon && <IconContainer>{icon}</IconContainer>}
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </EmptyStateContainer>
  );
}

export default EmptyState; 