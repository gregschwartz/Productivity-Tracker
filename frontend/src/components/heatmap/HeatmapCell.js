import React from 'react';
import styled from 'styled-components';

/**
 * Month label for heatmap
 */
const MonthLabel = styled.div`
  font-size: 8px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1;
  margin-bottom: 1px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `}
`;

/**
 * Day number in heatmap cell
 */
const DayNumber = styled.div`
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
`;

/**
 * Heatmap cell
 */
const HeatmapCellContainer = styled.div`
  aspect-ratio: 1;
  border-radius: ${props => props.theme.borderRadius.small};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid ${props => props.theme.colors.border};
  padding: 2px;
  
  ${props => {
    const intensity = props.$intensity || 0;
    const baseColor = props.theme.colors.primary;
    
    if (intensity === 0) {
      // No data - pale shade
      return `
        background: ${props.theme.colors.surface};
        border-color: ${props.theme.colors.border};
        color: ${props.theme.colors.text.muted};
      `;
    } else if (intensity <= 2) {
      // Low intensity
      return `
        background: ${baseColor}40;
        color: ${props.theme.colors.text.primary};
      `;
    } else if (intensity <= 6) {
      // Medium intensity
      return `
        background: ${baseColor}80;
        color: ${props.theme.colors.text.primary};
      `;
    } else {
      // High intensity
      return `
        background: ${baseColor};
        color: ${props.theme.colors.primaryText};
      `;
    }
  }}
  
  ${props => props.theme.name === 'tron' && props.$intensity > 0 && `
    box-shadow: ${props.theme.glow.small};
    border-color: ${props.theme.colors.primary};
  `}

  &:hover {
    transform: scale(1.1);
    z-index: 1;
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }
  
  ${props => props.$clickable && `
    cursor: pointer;
    
    &:active {
      transform: scale(1.05);
    }
  `}
`;

/**
 * Reusable HeatmapCell component
 * @param {Object} props - Component props
 * @param {number} props.intensity - Intensity value for coloring
 * @param {string} props.title - Tooltip title
 * @param {boolean} props.clickable - Whether the cell is clickable
 * @param {function} props.onClick - Click handler
 * @param {string} props.monthName - Month name to display
 * @param {boolean} props.isFirstOfMonth - Whether this is the first day of month
 * @param {string} props.children - Cell content (usually day number)
 * @param {string} props.className - Additional CSS classes
 */
function HeatmapCell({ 
  intensity = 0, 
  title = "", 
  clickable = false, 
  onClick = () => {}, 
  monthName = null,
  isFirstOfMonth = false,
  children,
  className = ""
}) {
  return (
    <HeatmapCellContainer
      $intensity={intensity}
      $clickable={clickable}
      title={title}
      onClick={clickable ? onClick : undefined}
      className={className}
    >
      {isFirstOfMonth && monthName && <MonthLabel>{monthName}</MonthLabel>}
      <DayNumber>{children}</DayNumber>
    </HeatmapCellContainer>
  );
}

export default HeatmapCell; 