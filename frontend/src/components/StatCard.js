import React from 'react';
import styled from 'styled-components';

/**
 * Individual stat card
 */
const StatCardContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 20px;
  text-align: center;
  box-shadow: ${props => props.theme.shadows.small};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
  `}
`;

/**
 * Stat card title (common theme)
 */
const StatCardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 16px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Stats container for two related stats
 */
const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 0px;
`;

/**
 * Individual stat within a card
 */
const IndividualStat = styled.div`
  text-align: center;
`;

/**
 * Stat value
 */
const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 4px;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-shadow: ${props.theme.glow.small};
  `}
`;

/**
 * Stat label
 */
const StatLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Reusable StatCard component
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {Array} props.stats - Array of stat objects with { value, label }
 * @param {string} props.className - Additional CSS classes
 */
function StatCard({ title, stats = [], className = "" }) {
  return (
    <StatCardContainer className={className}>
      <StatCardTitle>{title}</StatCardTitle>
      <StatsContainer>
        {stats.map((stat, index) => (
          <IndividualStat key={index}>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </IndividualStat>
        ))}
      </StatsContainer>
    </StatCardContainer>
  );
}

export default StatCard; 