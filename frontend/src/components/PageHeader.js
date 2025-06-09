import React from 'react';
import styled from 'styled-components';

/**
 * Page header styled component
 */
const PageHeaderContainer = styled.div.attrs({
  className: 'mb-8 text-center'
})``;

/**
 * Page title styled component
 */
const PageTitle = styled.h1.attrs(props => ({
  className: `
    text-4xl font-bold text-text-primary mb-2
    ${props.$theme === 'Tron' ? 'text-primary text-glow font-mono uppercase tracking-wider' : ''}
  `
}))``;

/**
 * Page subtitle styled component
 */
const PageSubtitle = styled.p.attrs({
  className: 'text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed'
})``;

/**
 * Reusable PageHeader component
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {string} props.currentTheme - Current theme name
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Optional additional content
 */
function PageHeader({ 
  title, 
  subtitle, 
  currentTheme = 'Ready', 
  className = "",
  children 
}) {
  return (
    <PageHeaderContainer className={className}>
      {title && <PageTitle $theme={currentTheme}>{title}</PageTitle>}
      {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
      {children}
    </PageHeaderContainer>
  );
}

export default PageHeader; 